package main

import (
	"context"
	"fmt"
	"github.com/apache/pulsar-client-go/pulsar"
	"log"
	"os"
	"strconv"
	"time"
)

const (
	ConsumerTimeout    = 30
	ReceiverQueueSize  = 5000
	ReturnBufferSecond = 5
	Earliest           = "earliest"
	Latest             = "latest"
)

var fileName = "/tmp/local_file.txt"
var msgSum, firstMsgPublishTime, lastMsgPublishTime int64
var msgIdList []pulsar.MessageID

func msgAppend(f *os.File, msg pulsar.Message) (int64, error) {
	if msg == nil {
		return 0, fmt.Errorf("msg is nil")
	}
	msgSum++
	if err := appendWrite(f, msg.Payload()); err != nil {
		log.Printf("Write append file error: %s\n", err)
		return 0, err
	}
	msgIdList = append(msgIdList, msg.ID())
	if len(msgIdList) == 1 {
		firstMsgPublishTime = msg.PublishTime().Unix()
	}
	lastMsgPublishTime = msg.PublishTime().Unix()
	fileSize, err := getFileSize(fileName)
	if err != nil {
		return 0, err
	}
	return fileSize, nil
}

// pulsar consumer generator and seek the position
func (d *DataInfo) consumerConn(client pulsar.Client, f *os.File) (pulsar.Consumer, error) {
	// seek offset
	var position pulsar.SubscriptionInitialPosition
	switch *d.PulsarSeekType {
	case Latest:
		position = pulsar.SubscriptionPositionLatest
	case Earliest:
		position = pulsar.SubscriptionPositionEarliest
	default:
		position = pulsar.SubscriptionPositionEarliest
	}
	partitionId, err := d.getPartitionId()
	if err != nil {
		return nil, err
	}
	// create consumer
	consumer, err := client.Subscribe(pulsar.ConsumerOptions{
		Topic:                       *d.TopicPartition,
		SubscriptionName:            *d.PulsarSubscriptionName,
		Type:                        pulsar.Exclusive,
		Name:                        *d.FunctionName + "-" + partitionId,
		ReceiverQueueSize:           ReceiverQueueSize,
		SubscriptionInitialPosition: position,
	})
	if err != nil {
		log.Printf("create consumer error: %s\n", err)
		return nil, err
	}
	// timestamp , seek position
	if *d.PulsarSeekType != Latest && *d.PulsarSeekType != Earliest {
		timeStamp, err := strconv.ParseInt(*d.PulsarSeekType, 10, 64)
		if err != nil {
			log.Printf("seek_type can not change to timestamp, error: %s\n", err)
			return nil, err
		}
		ctx, _ := context.WithTimeout(context.Background(), time.Duration(ConsumerTimeout)*time.Second)
		msg, err := consumer.Receive(ctx)
		if err != nil {
			log.Printf("consume earlist error: %s\n", err)
			return nil, nil
		}
		curMsgTime := msg.PublishTime().Unix()
		if timeStamp < curMsgTime {
			log.Printf("seek time %d, before current msg timestamp %d, no need reset", timeStamp, curMsgTime)
			if _, err := msgAppend(f, msg); err != nil {
				return nil, err
			}
			return consumer, nil
		}
		log.Printf("seek time %d, after current msg timestamp %d, reset position", timeStamp, curMsgTime)
		if err := consumer.SeekByTime(time.Unix(timeStamp, 0)); err != nil {
			log.Printf("seek to earlist msg error: %s\n", err)
			return nil, err
		}
	}
	log.Printf("---***---seek_type is %s, consumer connect success---***---\n", *d.PulsarSeekType)
	return consumer, nil
}

// upload file to COS and ACK the messages uploaded to COS
func (d *DataInfo) uploadAndACK(consumer pulsar.Consumer, f *os.File) (bool, error) {
	fileSize, err := getFileSize(fileName)
	if err != nil {
		return false, err
	}
	if fileSize == 0 {
		return false, nil
	}
	if d.timeoutJudgment(fileSize) {
		log.Printf("upload file to COS may cause timeOut, fileSize is %d, return...\n", fileSize)
		return true, nil
	}
	if err := d.uploadToCOS(fileName, fileSize); err != nil {
		log.Printf("Upload file error: %s\n", err)
		return false, err
	}
	log.Printf("%d messages upload, first msg publish time is %d, last msg publish time is %d, first id is %v, "+
		"last id is %v\n, ack them...\n", len(msgIdList), firstMsgPublishTime, lastMsgPublishTime, msgIdList[0],
		msgIdList[len(msgIdList)-1])
	// ack message one by one
	for j := 0; j < len(msgIdList); j++ {
		consumer.AckID(msgIdList[j])
	}
	// clean msgIdList and file
	msgIdList = msgIdList[0:0]
	if err := f.Truncate(0); err != nil {
		log.Printf("Truncate file error: %s\n", err)
		return false, err
	}
	if _, err := f.Seek(0, 0); err != nil {
		log.Printf("Seek file head error: %s\n", err)
		return false, err
	}
	return false, nil
}

// consumer worker
func (d *DataInfo) consumerWorker(client pulsar.Client) error {
	var needReturn bool
	// create file
	f, err := createFile(fileName)
	if err != nil {
		log.Printf("Create file error: %s\n", err)
		return err
	}
	// consumer connect
	consumer, err := d.consumerConn(client, f)
	if err != nil {
		return err
	}
	if consumer == nil {
		log.Printf("consumer timeout, no messages after wait %d seconds", ConsumerTimeout)
		return nil
	}
	defer func() {
		log.Printf("consumer close, file delete...\n")
		consumer.Close()
		if err := f.Close(); err != nil {
			log.Printf("file close err:%s\n", err)
		}
		if err := os.Remove(fileName); err != nil {
			log.Printf("file delete err:%s\n", err)
		}
	}()
	// consume messages
	for {
		if needReturn || (time.Now().Unix()-*d.StartTime+ReturnBufferSecond)*1000 >= *d.TimeLimit {
			log.Printf("Attention! Function should return now!\n")
			needReturn = true
			break
		}
		ctx, _ := context.WithTimeout(context.Background(), time.Duration(ConsumerTimeout)*time.Second)
		msg, err := consumer.Receive(ctx)
		if err != nil {
			// consumer timeout, not return error, print log
			log.Printf("consumer receive msg err: %s\n", err)
			break
		}
		fileSize, err := msgAppend(f, msg)
		if err != nil {
			return err
		}
		if fileSize >= *d.OnceMaxToCosBytes || len(msgIdList) >= ReceiverQueueSize {
			if needReturn, err = d.uploadAndACK(consumer, f); err != nil {
				log.Printf("upload file and ack messages err:%s", err)
				return err
			}
		}
	}
	// deal with last messages
	if !needReturn {
		if _, err := d.uploadAndACK(consumer, f); err != nil {
			log.Printf("upload file and ack messages err:%s", err)
			return err
		}
	}
	log.Printf("--***---Consumer job %s finish, msg length is %d---***--- \n", *d.TopicPartition, msgSum)
	return nil
}
