
/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/47077        *****
*****                                                                *****
**************************************************************************/

const elasticsearch = require('elasticsearch');
const dayjs = require('dayjs')

/**
 * 日志清洗逻辑，可自行修改
 * @param {*} record 
 */
function dealLog(record) {
  const esLogIgnoreWord = process.env.ES_Log_IgnoreWord || ''

  const ignoreWords = esLogIgnoreWord.split(',')

  if (ignoreWords.length) {
    for (const word of ignoreWords) {
      delete record[word]
    }
  }
  record.time = dayjs().toISOString()
  return record
}

/**
 * 生成投递到es的数据
 * @param {*} records 
 */
async function genData(records, esIndex) {
  const logs = []

  for (const record of records) {

    let log = record.Ckafka.msgBody

    try {
      let _log = log
      while(true) {
        const type = Object.prototype.toString.call(_log).slice(8, -1).toLowerCase()
        if (type === 'object') {
          break
        } else if (type !== 'string') {
          throw new Error()
        }
        _log = JSON.parse(_log)
      }

      if (_log.hasOwnProperty('message') && typeof _log.message === 'string') {
        const message = _log.message
        delete _log.message
        _log =  { ..._log, ...JSON.parse(message)}
      }

      _log = dealLog(_log)

      for (const key of Object.keys(_log)) {
        _log[key] = typeof _log[key] === 'object' ? JSON.stringify(_log[key]) : _log[key]
      }

      logs.push({
        index: Object.assign({ _index: esIndex }, _log['log_id'] ? { _id: _log['log_id'] } : {})
      })
      logs.push(_log)

    } catch (err) {
      logs.push({
          index: {
            _index: esIndex
          }
        })
      logs.push({
        msg_body: log
      })
    }
  }

  return logs
}

exports.main_handler = async (event, context) => {
  try {
    /** 必填环境变量  */
    const esServer = process.env.ES_Address
    const esUsr = process.env.ES_User
    const esPw = process.env.ES_Password 
    const esIndexKeyword = process.env.ES_Index_KeyWord
    const esIndexTimeFormat = process.env.ES_Index_TimeFormat === 'hour' ? "YYYY-MM-DD-HH" : "YYYY-MM-DD"
    const esIndex = `${esIndexKeyword}-${dayjs().format(esIndexTimeFormat)}`

    const records = event.Records || []
    console.log(`the length of msg body is ${records.length}`)

    const client = new elasticsearch.Client({
      host: esServer,
      httpAuth: `${esUsr}:${esPw}`
    })

    await client.ping({ requestTimeout: 30000 })

    try {
      await client.indices.create({
        index: esIndex
      })
    } catch (err) {
    }
    
    const datas = await genData(records, esIndex)

    await client.bulk({
      body: datas
    })

    return "success"
  } catch (err) {
    console.log(err)
    return "failed!"
  }
};
