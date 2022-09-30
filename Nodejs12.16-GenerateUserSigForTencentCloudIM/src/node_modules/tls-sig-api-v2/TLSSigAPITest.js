var TLSSigAPIv2 = require('./TLSSigAPIv2');

var api = new TLSSigAPIv2.Api(1400000000, "5bd2850fff3ecb11d7c805251c51ee463a25727bddc2385f3fa8bfee1bb93b5e");
var sig = api.genUserSig("xiaojun", 86400 * 180);
console.log("sig " + sig);
var sig = api.genPrivateMapKey("xiaojun", 86400 * 180, 10000, 255);
console.log("sig with userbuf " + sig);
var sig = api.genPrivateMapKeyWithStringRoomID("xiaojun", 86400 * 180, "1000000040", 255);
console.log("sig with userbuf string room " + sig);
