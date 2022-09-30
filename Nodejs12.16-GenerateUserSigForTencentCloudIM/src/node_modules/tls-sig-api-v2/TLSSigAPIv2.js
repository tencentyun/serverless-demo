var crypto = require('crypto');
var zlib = require('zlib');

var base64url = {};

var newBuffer = function (fill, encoding) {
    return Buffer.from ? Buffer.from(fill, encoding) : new Buffer(fill, encoding)
};

base64url.unescape = function unescape(str) {
    return (str + Array(5 - str.length % 4))
        .replace(/_/g, '=')
        .replace(/\-/g, '/')
        .replace(/\*/g, '+');
};

base64url.escape = function escape(str) {
    return str.replace(/\+/g, '*')
        .replace(/\//g, '-')
        .replace(/=/g, '_');
};

base64url.encode = function encode(str) {
    return this.escape(newBuffer(str).toString('base64'));
};

base64url.decode = function decode(str) {
    return newBuffer(this.unescape(str), 'base64').toString();
};

function base64encode(str) {
    return newBuffer(str).toString('base64')
}

function base64decode(str) {
    return newBuffer(str, 'base64').toString()
}

var Api = function (sdkappid, key) {
    this.sdkappid = sdkappid;
    this.key = key;
};
/**
 * 通过传入参数生成 base64 的 hmac 值
 * @param identifier
 * @param currTime
 * @param expire
 * @returns {string}
 * @private
 */
Api.prototype._hmacsha256 = function (identifier, currTime, expire, base64UserBuf) {
    var contentToBeSigned = "TLS.identifier:" + identifier + "\n";
    contentToBeSigned += "TLS.sdkappid:" + this.sdkappid + "\n";
    contentToBeSigned += "TLS.time:" + currTime + "\n";
    contentToBeSigned += "TLS.expire:" + expire + "\n";
    if (null != base64UserBuf) {
        contentToBeSigned += "TLS.userbuf:" + base64UserBuf + "\n";
    }
    const hmac = crypto.createHmac("sha256", this.key);
    return hmac.update(contentToBeSigned).digest('base64');
};
/**
 * TRTC业务进房权限加密串需使用用户定义的userbuf
 * @brief 生成 userbuf
 * @param account 用户名
 * @param dwSdkappid sdkappid
 * @param dwAuthID  数字房间号
 * @param dwExpTime 过期时间：该权限加密串的过期时间，建议300秒，实际过期时间:now+dwExpTime
 * @param dwPrivilegeMap 用户权限，255表示所有权限
 * @param dwAccountType 用户类型,默认为0
 * @param roomstr 字符串房间号
 * @return userbuf  {string}  返回的userbuf
 */
Api.prototype._genUserbuf = function (account, dwAuthID, dwExpTime,
    dwPrivilegeMap, dwAccountType, roomstr) {

    let accountLength = account.length;
    let roomstrlength = 0;
    let length = 1 + 2 + accountLength + 20 ;
    if (null != roomstr)
    {
        roomstrlength = roomstr.length;
        length = length + 2 + roomstrlength;
    }
    let offset = 0;
    let userBuf = new Buffer.alloc(length);

    //cVer
    if (null != roomstr)
        userBuf[offset++] = 1;
    else
        userBuf[offset++] = 0;

    //wAccountLen
    userBuf[offset++] = (accountLength & 0xFF00) >> 8;
    userBuf[offset++] = accountLength & 0x00FF;

    //buffAccount
    for (; offset < 3 + accountLength; ++offset) {
        userBuf[offset] = account.charCodeAt(offset - 3);
    }

    //dwSdkAppid
    userBuf[offset++] = (this.sdkappid & 0xFF000000) >> 24;
    userBuf[offset++] = (this.sdkappid & 0x00FF0000) >> 16;
    userBuf[offset++] = (this.sdkappid & 0x0000FF00) >> 8;
    userBuf[offset++] = this.sdkappid & 0x000000FF;

    //dwAuthId
    userBuf[offset++] = (dwAuthID & 0xFF000000) >> 24;
    userBuf[offset++] = (dwAuthID & 0x00FF0000) >> 16;
    userBuf[offset++] = (dwAuthID & 0x0000FF00) >> 8;
    userBuf[offset++] = dwAuthID & 0x000000FF;

    //过期时间：dwExpTime+now
    let expire = Date.now() / 1000 + dwExpTime;
    userBuf[offset++] = (expire & 0xFF000000) >> 24;
    userBuf[offset++] = (expire & 0x00FF0000) >> 16;
    userBuf[offset++] = (expire & 0x0000FF00) >> 8;
    userBuf[offset++] = expire & 0x000000FF;

    //dwPrivilegeMap
    userBuf[offset++] = (dwPrivilegeMap & 0xFF000000) >> 24;
    userBuf[offset++] = (dwPrivilegeMap & 0x00FF0000) >> 16;
    userBuf[offset++] = (dwPrivilegeMap & 0x0000FF00) >> 8;
    userBuf[offset++] = dwPrivilegeMap & 0x000000FF;

    //dwAccountType
    userBuf[offset++] = (dwAccountType & 0xFF000000) >> 24;
    userBuf[offset++] = (dwAccountType & 0x00FF0000) >> 16;
    userBuf[offset++] = (dwAccountType & 0x0000FF00) >> 8;
    userBuf[offset++] = dwAccountType & 0x000000FF;

    if (null != roomstr) {
        //roomstrlength
        userBuf[offset++] = (roomstr.length & 0xFF00) >> 8;
        userBuf[offset++] = roomstr.length & 0x00FF;

        //roomstr
        for (; offset < length; ++offset) {
            userBuf[offset] = roomstr.charCodeAt(offset - (length - roomstr.length));
        }
    }

    return userBuf;
}
Api.prototype.genSig = function (userid, expire, userBuf) {
    var currTime = Math.floor(Date.now() / 1000);

    var sigDoc = {
        'TLS.ver': "2.0",
        'TLS.identifier': "" + userid,
        'TLS.sdkappid': Number(this.sdkappid),
        'TLS.time': Number(currTime),
        'TLS.expire': Number(expire)
    };

    var sig = '';
    if (null != userBuf) {
        var base64UserBuf = base64encode(userBuf);
        sigDoc['TLS.userbuf'] = base64UserBuf;
        sig = this._hmacsha256(userid, currTime, expire, base64UserBuf);
    } else {
        sig = this._hmacsha256(userid, currTime, expire, null);
    }
    sigDoc['TLS.sig'] = sig;

    var compressed = zlib.deflateSync(newBuffer(JSON.stringify(sigDoc))).toString('base64');
    return base64url.escape(compressed);
}
/**
 *【功能说明】用于签发 TRTC 和 IM 服务中必须要使用的 UserSig 鉴权票据
 *
 *【参数说明】
 * @param userid - 用户id，限制长度为32字节，只允许包含大小写英文字母（a-zA-Z）、数字（0-9）及下划线和连词符。
 * @param expire - UserSig 票据的过期时间，单位是秒，比如 86400 代表生成的 UserSig 票据在一天后就无法再使用了。
 */
Api.prototype.genUserSig = function (userid, expire) {
    return this.genSig(userid, expire, null);
};

/**
 *【功能说明】
 * 用于签发 TRTC 进房参数中可选的 PrivateMapKey 权限票据。
 * PrivateMapKey 需要跟 UserSig 一起使用，但 PrivateMapKey 比 UserSig 有更强的权限控制能力：
 *  - UserSig 只能控制某个 UserID 有无使用 TRTC 服务的权限，只要 UserSig 正确，其对应的 UserID 可以进出任意房间。
 *  - PrivateMapKey 则是将 UserID 的权限控制的更加严格，包括能不能进入某个房间，能不能在该房间里上行音视频等等。
 * 如果要开启 PrivateMapKey 严格权限位校验，需要在【实时音视频控制台】=>【应用管理】=>【应用信息】中打开“启动权限密钥”开关。
 *
 *【参数说明】
 * @param userid - 用户id，限制长度为32字节，只允许包含大小写英文字母（a-zA-Z）、数字（0-9）及下划线和连词符。
 * @param expire - PrivateMapKey 票据的过期时间，单位是秒，比如 86400 生成的 PrivateMapKey 票据在一天后就无法再使用了。
 * @param roomid - 房间号，用于指定该 userid 可以进入的房间号
 * @param privilegeMap - 权限位，使用了一个字节中的 8 个比特位，分别代表八个具体的功能权限开关：
 *  - 第 1 位：0000 0001 = 1，创建房间的权限
 *  - 第 2 位：0000 0010 = 2，加入房间的权限
 *  - 第 3 位：0000 0100 = 4，发送语音的权限
 *  - 第 4 位：0000 1000 = 8，接收语音的权限
 *  - 第 5 位：0001 0000 = 16，发送视频的权限  
 *  - 第 6 位：0010 0000 = 32，接收视频的权限  
 *  - 第 7 位：0100 0000 = 64，发送辅路（也就是屏幕分享）视频的权限
 *  - 第 8 位：1000 0000 = 200，接收辅路（也就是屏幕分享）视频的权限  
 *  - privilegeMap == 1111 1111 == 255 代表该 userid 在该 roomid 房间内的所有功能权限。
 *  - privilegeMap == 0010 1010 == 42  代表该 userid 拥有加入房间和接收音视频数据的权限，但不具备其他权限。
 */
Api.prototype.genPrivateMapKey = function (userid, expire, roomid, privilegeMap) {
    var userBuf = this._genUserbuf(userid, roomid, expire, privilegeMap, 0, null);
    return this.genSig(userid, expire, userBuf);

};
/**
 *【功能说明】
 * 用于签发 TRTC 进房参数中可选的 PrivateMapKey 权限票据。
 * PrivateMapKey 需要跟 UserSig 一起使用，但 PrivateMapKey 比 UserSig 有更强的权限控制能力：
 *  - UserSig 只能控制某个 UserID 有无使用 TRTC 服务的权限，只要 UserSig 正确，其对应的 UserID 可以进出任意房间。
 *  - PrivateMapKey 则是将 UserID 的权限控制的更加严格，包括能不能进入某个房间，能不能在该房间里上行音视频等等。
 * 如果要开启 PrivateMapKey 严格权限位校验，需要在【实时音视频控制台】=>【应用管理】=>【应用信息】中打开“启动权限密钥”开关。
 *
 *【参数说明】
 * @param userid - 用户id，限制长度为32字节，只允许包含大小写英文字母（a-zA-Z）、数字（0-9）及下划线和连词符。
 * @param expire - PrivateMapKey 票据的过期时间，单位是秒，比如 86400 生成的 PrivateMapKey 票据在一天后就无法再使用了。
 * @param roomstr - 房间号，用于指定该 userid 可以进入的房间号
 * @param privilegeMap - 权限位，使用了一个字节中的 8 个比特位，分别代表八个具体的功能权限开关：
 *  - 第 1 位：0000 0001 = 1，创建房间的权限
 *  - 第 2 位：0000 0010 = 2，加入房间的权限
 *  - 第 3 位：0000 0100 = 4，发送语音的权限
 *  - 第 4 位：0000 1000 = 8，接收语音的权限
 *  - 第 5 位：0001 0000 = 16，发送视频的权限  
 *  - 第 6 位：0010 0000 = 32，接收视频的权限  
 *  - 第 7 位：0100 0000 = 64，发送辅路（也就是屏幕分享）视频的权限
 *  - 第 8 位：1000 0000 = 200，接收辅路（也就是屏幕分享）视频的权限  
 *  - privilegeMap == 1111 1111 == 255 代表该 userid 在该房间内的所有功能权限。
 *  - privilegeMap == 0010 1010 == 42  代表该 userid 拥有加入房间和接收音视频数据的权限，但不具备其他权限。
 */
Api.prototype.genPrivateMapKeyWithStringRoomID = function (userid, expire, roomstr, privilegeMap) {
    var userBuf = this._genUserbuf(userid, 0, expire, privilegeMap, 0, roomstr);
    return this.genSig(userid, expire, userBuf);

};

exports.Api = Api;