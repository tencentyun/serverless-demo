
/**************************************************
Node8.9-Mysql
Reference: mysql api---https://www.npmjs.com/package/mysql
Reference: How to access database---https://cloud.tencent.com/document/product/236/3130
Reference: How to connect api gateway with scf---https://cloud.tencent.com/document/product/628/11983
***************************************************/

function wrapPromise(connection, sql) {
  return new Promise((res, rej) => {
    connection.query(sql, function(error, results, fields) {
      if (error) {
        rej(error)
      }
      res(results)
    })
  })
}


exports.main_handler = async (event, context, callback) => {
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: 'xxxx', // The ip address of cloud database instance, 云数据库实例ip地址
    user: 'xxx', // The name of cloud database, for example, root, 云数据库用户名，如root
    password: 'xxx', // Password of cloud database, 云数据库密码
    database: 'xxx' // Name of the cloud database, 数据库名称
  });

  connection.connect();

  // get value from apigw
  const {CustomerID, CustomerName} = event.queryString

  const updateSql = `UPDATE Customers SET CustomerName = '${CustomerName}' WHERE CustomerID = ${CustomerID}`
  const querySql = `SELECT * from Customers`

  await wrapPromise(connection, updateSql)

  let queryResult = await wrapPromise(connection, querySql)
  
  connection.end();

  return queryResult
}

