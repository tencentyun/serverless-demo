package main

import (
	"encoding/json"
	"fmt"
	"github.com/apache/pulsar-client-go/pulsar"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/errors"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	scf "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/scf/v20180416"
	"log"
	"sync"
)

func timerHandler(client pulsar.Client, dataInfo DataInfo) error {
	// get partitions
	partitions, err := client.TopicPartitions(fmt.Sprintf(PulsarTopic, *dataInfo.PulsarCluster,
		*dataInfo.PulsarEnvironmentId, *dataInfo.PulsarTopicName))
	if err != nil {
		log.Printf("get partitions error:%s\n",
			err.Error())
		return err
	}
	log.Printf("TDMQ TopicPartitions:%v", partitions)
	// scf client
	credential := common.NewTokenCredential(
		*dataInfo.SecretId,
		*dataInfo.SecretKey,
		*dataInfo.Token,
	)
	cpf := profile.NewClientProfile()
	cpf.HttpProfile.Endpoint = "scf.internal.tencentcloudapi.com"
	scfClient, err := scf.NewClient(credential, *dataInfo.Region, cpf)
	if err != nil {
		log.Printf("scf client connect err:%s\n", err)
		return err
	}
	// new consumer group by partition
	var wg sync.WaitGroup
	wg.Add(len(partitions))
	for i := 0; i < len(partitions); i++ {
		go eventHandler(scfClient, partitions[i], *dataInfo.Namespace, *dataInfo.FunctionName, wg.Done)
	}
	wg.Wait()
	return nil
}

func eventHandler(scfClient *scf.Client, topicPartition string, namespace string, functionName string, done func()) {
	cliCTX, _ := json.Marshal(&DefineEvent{
		InvokeType:     ConsumeGroupByPartition,
		TopicPartition: topicPartition,
	})
	request := scf.NewInvokeRequest()
	request.Namespace = common.StringPtr(namespace)
	request.FunctionName = common.StringPtr(functionName)
	request.ClientContext = common.StringPtr(string(cliCTX))
	request.InvocationType = common.StringPtr("Event")
	response, err := scfClient.Invoke(request)
	if _, ok := err.(*errors.TencentCloudSDKError); ok {
		log.Printf("An API error has returned: %s\n",
			err)
		return
	}
	if err != nil {
		panic(err)
	}
	log.Printf("event invoke response: %s\n",
		response.ToJsonString())
	defer done()
}
