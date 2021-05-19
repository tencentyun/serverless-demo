package main

import (
	"context"
	"fmt"
	"github.com/tencentyun/scf-go-lib/functioncontext"
	"log"
	"strconv"
)

const (
	TZ = "Asia/Shanghai"
	// result
	Success             = "Success"
	PulsarConnectError  = "PulsarConnectError"
	InvalidParameter    = "InvalidParameter"
	TimerInvokeError    = "TimerInvokeError"
	ConsumerInvokeError = "ConsumerInvokeError"
	//	invoke type
	Timer                   = "Timer"
	ConsumeGroupByPartition = "ConsumeGroupByPartition"
	// pulsar
	PulsarURL      = "pulsar://%s"
	PulsarListener = "custom:%s"
	PulsarTopic    = "persistent://%s/%s/%s"
)

// Invoke Event Definition
type DefineEvent struct {
	InvokeType     string `json:"Type"`
	TopicPartition string `json:"TopicPartition"`
}

// Parameters Struct
type DataInfo struct {
	// from event
	TopicPartition *string `json:"TopicPartition"`
	// from ctx
	TimeLimit    *int64  `json:"time_limit_in_ms"`
	RequestId    *string `json:"request_id"`
	FunctionName *string `json:"function_name"`
	Namespace    *string `json:"namespace"`
	Region       *string `json:"tencentcloud_region"`
	// from env
	SecretId  *string `json:"TENCENTCLOUD_SECRETID"`
	SecretKey *string `json:"TENCENTCLOUD_SECRETKEY"`
	Token     *string `json:"TENCENTCLOUD_SESSIONTOKEN"`
	/* TDMQ */
	PulsarURL              *string `json:"tdmq_url"`
	PulsarListener         *string `json:"tdmq_listener"`
	PulsarToken            *string `json:"tdmq_token"`
	PulsarCluster          *string `json:"tdmq_cluster_id"`
	PulsarEnvironmentId    *string `json:"tdmq_environment_id"`
	PulsarTopicName        *string `json:"tdmq_topic_name"`
	PulsarSubscriptionName *string `json:"tdmq_subscription_name"`
	PulsarSeekType         *string `json:"seek_type"`
	/* COS */
	COSBucketURL      *string `json:"cos_bucket_url"`
	FilePathPrefix    *string `json:"file_path_prefix"`
	OnceMaxToCosBytes *int64  `json:"once_max_to_cos_bytes"`
	// append params
	StartTime *int64 `json:"start_time"`
}

func paramCheck(ctx context.Context, event DefineEvent, startTimestamp int64) (*DataInfo, error) {
	lc, ok := functioncontext.FromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("ctx parse error")
	}
	log.Printf("ctx: %#v\n", lc)
	dataInfo := &DataInfo{}
	dataInfo.StartTime = &startTimestamp
	// check params in event
	if event.InvokeType == "" {
		return nil, fmt.Errorf("InvokeType not exists in event")
	}
	if event.InvokeType != Timer && event.InvokeType != ConsumeGroupByPartition {
		return nil, fmt.Errorf("invalid InvokeType: %s", event.InvokeType)
	}
	if event.InvokeType == ConsumeGroupByPartition {
		if event.TopicPartition == "" {
			return nil, fmt.Errorf("TopicPartition not exists in event")
		}
		dataInfo.TopicPartition = &(event.TopicPartition)
	}
	// check params in context
	timeLimit := int64(lc.TimeLimitInMs)
	dataInfo.TimeLimit = &timeLimit
	requestId := lc.RequestID
	dataInfo.RequestId = &requestId
	functionName := lc.FunctionName
	dataInfo.FunctionName = &functionName
	namespace := lc.Namespace
	dataInfo.Namespace = &namespace
	// check auth key
	if err := dataInfo.authCheck(lc.Environment); err != nil {
		return nil, err
	}
	// check params in Environment variable
	if err := dataInfo.environmentCheck(lc.Environment); err != nil {
		return nil, err
	}
	return dataInfo, nil
}

func (d *DataInfo) authCheck(envMap map[string]string) error {
	secretId, ok := envMap["TENCENTCLOUD_SECRETID"]
	if !ok {
		return fmt.Errorf("environment variable TENCENTCLOUD_SECRETID is empty")
	}
	d.SecretId = &secretId
	secretKey, ok := envMap["TENCENTCLOUD_SECRETKEY"]
	if !ok {
		return fmt.Errorf("environment variable TENCENTCLOUD_SECRETKEY is empty")
	}
	d.SecretKey = &secretKey
	sessionToken, ok := envMap["TENCENTCLOUD_SESSIONTOKEN"]
	if !ok {
		return fmt.Errorf("environment variable TENCENTCLOUD_SESSIONTOKEN is empty")
	}
	d.Token = &sessionToken
	return nil
}

func (d *DataInfo) environmentCheck(envMap map[string]string) error {
	region, ok := envMap["region"]
	if !ok {
		return fmt.Errorf("environment variable region is empty")
	}
	d.Region = &region
	tdmqUrl, ok := envMap["tdmq_url"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_url is empty")
	}
	d.PulsarURL = &tdmqUrl
	tdmqListener, ok := envMap["tdmq_listener"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_listener is empty")
	}
	d.PulsarListener = &tdmqListener
	tdmqToken, ok := envMap["tdmq_token"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_token is empty")
	}
	d.PulsarToken = &tdmqToken
	tdmqClusterId, ok := envMap["tdmq_cluster_id"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_cluster_id is empty")
	}
	d.PulsarCluster = &tdmqClusterId
	tdmqEnvironmentId, ok := envMap["tdmq_environment_id"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_environment_id is empty")
	}
	d.PulsarEnvironmentId = &tdmqEnvironmentId
	tdmqTopicName, ok := envMap["tdmq_topic_name"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_topic_name is empty")
	}
	d.PulsarTopicName = &tdmqTopicName
	subscriptionName, ok := envMap["tdmq_subscription_name"]
	if !ok {
		return fmt.Errorf("environment variable tdmq_subscription_name is empty")
	}
	d.PulsarSubscriptionName = &subscriptionName
	seekType, ok := envMap["seek_type"]
	if !ok {
		return fmt.Errorf("environment variable seek_type is empty")
	}
	d.PulsarSeekType = &seekType
	cosBucketName, ok := envMap["cos_bucket_name"]
	if !ok {
		return fmt.Errorf("environment variable cos_bucket_url is empty")
	}
	cosBucketURL := "https://" + cosBucketName + ".cos." + region + ".myqcloud.com"
	d.COSBucketURL = &cosBucketURL
	filePathPrefix, ok := envMap["file_path_prefix"]
	if !ok {
		return fmt.Errorf("environment variable file_path_prefix is empty")
	}
	d.FilePathPrefix = &filePathPrefix
	onceMaxToCosBytesStr, ok := envMap["once_max_to_cos_bytes"]
	if !ok {
		return fmt.Errorf("environment variable once_max_to_cos_bytes is empty")
	}
	onceMaxToCosBytes, err := strconv.ParseInt(onceMaxToCosBytesStr, 10, 64)
	if err != nil {
		return fmt.Errorf("environment variable once_max_to_cos_bytes is not number")
	}
	d.OnceMaxToCosBytes = &onceMaxToCosBytes
	return nil
}
