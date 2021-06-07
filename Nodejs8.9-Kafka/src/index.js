/**************************************************
Nodejs8.9 - kafka 
TIPS: 
1. The cloud function and kafka should in same vpc
   云函数需求kafka实例位于相同的vpc内
Reference: 
1. https://www.npmjs.com/package/kafka-node - kafka Node.js 
2. https://cloud.tencent.com/product/ckafka/getting-started - ckafka document
***************************************************/

const kafka = require('kafka-node');
const client = new kafka.KafkaClient({ kafkaHost: '*****' }); // The address of ckafka host, you can also check it in the "basic information" of ckafka
                                                             //ckafka host地址，在ckafka基本信息也查看
const producer = new kafka.Producer(client)

const deal = (cb) => {
  if (producer.ready) return cb();
  producer.on('ready', function() {
    cb();
  });
}

const send = async (payloads) => {
  return new Promise((resolve, reject) => {
    deal(() => {
      producer.send(payloads, function (err, data) {
        if (err) {
          return reject(err)
        }
        resolve(data)
      });
    })
  })
}

exports.main_handler = async (event, context, callback) => {

  const payloads = [
    { 
      topic: 'test', // The name of the topic
                    //topic 名称
      messages: 'hello world', // THe message body
    }
  ]


  try {
    const result = await send(payloads);
  } catch(err) {
    console.log('reject', err);
  };
};
