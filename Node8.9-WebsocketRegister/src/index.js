"use strict";
/**************************************************
Node8.9-WebsocketRegister
Reference: https://cloud.tencent.com/document/product/583/32553
***************************************************/

// The url of API gateway's send back host, API网关的反向推送链接
// The information of MySql host, you need to build the database and forms in priority, there are 2 columns: `ConnectionID`, `Date`
// MySql数据库账号信息,需要提前创建好数据库和表单,表单中新建2列：`ConnectionID`, `Date`
const Host = "**";
const User = "**";
const Password = "**";
const Port = 61631;
const DB = "SCF_Demo";
const Table = "ConnectionID_List";

const mysql = require("mysql");
const dayjs = require("dayjs");

function wrapPromise(connection, sql) {
  return new Promise((res, rej) => {
    connection.query(sql, function(error, results, fields) {
      if (error) {
        rej(error);
      }
      res(results);
    });
  });
}

async function record_connectionID(connectionID) {
  console.log("Start record_connectionID function");
  console.log("connectionID is", connectionID);

  const connection = mysql.createConnection({
    host: Host,
    user: User,
    password: Password,
    database: DB,
    port: Port
  });

  // Save the connection ID into datavase, 把 connection ID 存到数据库
  const now = new dayjs();
  const nowStr = now.format("YYYY-MM-DD HH:mm:ss");

  let addsql = `insert INTO ${Table} (\`ConnectionID\`, \`Date\`) VALUES ('${connectionID}', '${nowStr}')`;

  await wrapPromise(connection, addsql);
  connection.end();
}

exports.main_handler = async (event, context, callback) => {
  console.log("event is", event);

  if (!event.requestContext) {
    return { errNo: 101, errMsg: "not found request context" };
  }

  if (!event.websocket) {
    return { errNo: 102, errMsg: "not found web socket" };
  }

  let connectionID = event["websocket"]["secConnectionID"];
  let retmsg = {};
  retmsg["errNo"] = 0;
  retmsg["errMsg"] = "ok";
  retmsg["websocket"] = {
    action: "connecting",
    secConnectionID: connectionID
  };

  // Recording the new connectionID into database, 在数据库中记录新的connectionID
  console.log("Start DB Request", new dayjs().format("YYYY-MM-DD HH:mm:ss"));

  await record_connectionID(connectionID);

  console.log("Finish DB Request", new dayjs().format("YYYY-MM-DD HH:mm:ss"));

  console.log(
    "connecting: connection id",
    event["websocket"]["secConnectionID"]
  );
  return retmsg;
};
