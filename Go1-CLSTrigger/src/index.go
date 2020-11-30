package main

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"

	jsoniter "github.com/json-iterator/go"
	"github.com/tencentyun/scf-go-lib/cloudfunction"
)

var JSON = jsoniter.Config{
	EscapeHTML:             true,
	SortMapKeys:            false,
	ValidateJsonRawMessage: true,
}.Froze()

type ClsMsg struct {
	TopicID   string `json:"topic_id"`
	TopicName string `json:"topic_name"`
	Records   []*Log `json:"records"`
}

type Log struct {
	// 日志时间
	Timestamp int64 `json:"timestamp"`

	// 日志内容
	Content string `json:"content"`
}

func process(ctx context.Context, event map[string]map[string]string) (string, error) {
	zipData := event["clslogs"]["data"]
	clsMessage, err := decodeMessage(zipData)
	if err != nil {
		return "", err
	}

	fmt.Printf("topic_id: %s, topic_name: %s\n", clsMessage.TopicID, clsMessage.TopicName)
	for _, log := range clsMessage.Records {
		content := map[string]string{}
		if err := json.Unmarshal([]byte(log.Content), &content); err != nil {
			return "", err
		}

		for k, v := range content {
			fmt.Printf("log key: %s, log value: %s\n", k, v)
		}
	}

	return "", nil
}

func main() {
	// Make the handler available for Remote Procedure Call by Cloud Function
	cloudfunction.Start(process)
}

//  string  -> unbase64  -> unGzip -> jsonString -> struct
func decodeMessage(message string) (*ClsMsg, error) {
	var clsMessage ClsMsg
	gzipByte, err := base64.StdEncoding.DecodeString(message)
	if err != nil {
		return nil, err
	}
	reader := bytes.NewReader(gzipByte)
	gzipReader, _ := gzip.NewReader(reader)
	defer gzipReader.Close()
	jsonByte, err := ioutil.ReadAll(gzipReader)
	if err != nil {
		return nil, err
	}
	if err := JSON.Unmarshal(jsonByte, &clsMessage); err != nil {
		return nil, err
	}
	return &clsMessage, nil
}