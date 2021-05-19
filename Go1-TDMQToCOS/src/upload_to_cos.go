package main

import (
	"context"
	"fmt"
	"github.com/tencentyun/cos-go-sdk-v5"
	"github.com/tencentyun/cos-go-sdk-v5/debug"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	// file_prefix/PulsarClusterId/EnvironmentId/topic_name/subscription_name/date/
	// from_begin_to_end_partitionId_timeStamp_requestId
	COSKey = "%s%s/%s/%s/%s/%s/from_%d_to_%d_%s_%d_%s.txt"
)

// init cosUploadSpeed 10MB/s
var cosUploadSpeed = float64(1024 * 1024 * 10)

func refreshSpeed(size int64, cost int64) {
	if cost == 0 {
		cost = 1
	}
	cosUploadSpeed = float64(size / cost)
	log.Printf("update upload speed to %fMB/s\n", cosUploadSpeed/1024/1024)
}

func logStatus(err error) {
	if cos.IsNotFoundError(err) {
		// WARN
		log.Println("WARN: Resource is not existed")
	} else if e, ok := cos.IsCOSError(err); ok {
		log.Printf("COS ERROR: Code: %v\n", e.Code)
		log.Printf("COS ERROR: Message: %v\n", e.Message)
		log.Printf("COS ERROR: Resource: %v\n", e.Resource)
		log.Printf("COS ERROR: RequestId: %v\n", e.RequestID)
		// ERROR
	} else {
		log.Printf("COS ERROR: %v\n", err)
		// ERROR
	}
}

func (d *DataInfo) getPartitionId() (string, error) {
	ptArr := strings.Split(*d.TopicPartition, "-")
	if len(ptArr) < 2 {
		return "", fmt.Errorf("from topicPartition get partitionId error")
	}
	return ptArr[len(ptArr)-1], nil
}

func (d *DataInfo) timeoutJudgment(fileSize int64) bool {
	if (float64(fileSize)/cosUploadSpeed+float64(time.Now().Unix()-*d.StartTime+ReturnBufferSecond))*1000 >
		float64(*d.TimeLimit) {
		return true
	}
	return false
}

func (d *DataInfo) fileNameGenerator(partitionId string) string {
	now := time.Now()
	timeStamp := now.Unix()
	loc, _ := time.LoadLocation(TZ)
	year, month, day := now.In(loc).Date()
	date := fmt.Sprintf("%d-%02d-%02d", year, month, day)
	return fmt.Sprintf(COSKey, *d.FilePathPrefix, *d.PulsarCluster, *d.PulsarEnvironmentId,
		*d.PulsarTopicName, *d.PulsarSubscriptionName, date, firstMsgPublishTime, lastMsgPublishTime,
		partitionId, timeStamp, *d.RequestId)
}

func (d *DataInfo) uploadToCOS(fileName string, fileSize int64) error {
	uploadStartTime := time.Now()
	log.Printf("start upload file to COS, fileSize is %d,...\n", fileSize)
	partitionId, err := d.getPartitionId()
	if err != nil {
		return err
	}
	cosFilePath := d.fileNameGenerator(partitionId)
	u, _ := url.Parse(*d.COSBucketURL)
	b := &cos.BaseURL{BucketURL: u}
	c := cos.NewClient(b, &http.Client{
		Transport: &cos.AuthorizationTransport{
			SecretID:     *d.SecretId,
			SecretKey:    *d.SecretKey,
			SessionToken: *d.Token,
			Transport: &debug.DebugRequestTransport{
				RequestHeader: true,
				// Notice when put a large file and set need the request body, might happend out of memory error.
				RequestBody:    false,
				ResponseHeader: true,
				ResponseBody:   false,
			},
		},
	})
	// 通过本地文件上传对象, STANDARD_IA：低频存储
	_, err = c.Object.PutFromFile(context.Background(), cosFilePath, fileName,
		&cos.ObjectPutOptions{ObjectPutHeaderOptions: &cos.ObjectPutHeaderOptions{XCosStorageClass: "STANDARD_IA"}})
	if err != nil {
		logStatus(err)
		return err
	}
	log.Printf("upload file to COS end...\n")
	refreshSpeed(fileSize, time.Now().Unix()-uploadStartTime.Unix())
	return nil
}
