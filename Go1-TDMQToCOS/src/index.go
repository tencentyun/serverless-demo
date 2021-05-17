package main

import (
	"context"
	"fmt"
	"github.com/apache/pulsar-client-go/pulsar"
	pulsarLog "github.com/apache/pulsar-client-go/pulsar/log"
	"github.com/sirupsen/logrus"
	"github.com/tencentyun/scf-go-lib/cloudfunction"
	"log"
	"time"
)

func process(ctx context.Context, event DefineEvent) (string, error) {
	startTime := time.Now()
	log.Printf("function start...\n")
	dataInfo, err := paramCheck(ctx, event, startTime.Unix())
	if err != nil {
		log.Printf("invalid context and event params: %s", err)
		return InvalidParameter, err
	}
	// tdmq connect
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	pulsarLogger := pulsarLog.NewLoggerWithLogrus(logger)
	client, err := pulsar.NewClient(pulsar.ClientOptions{
		URL:            fmt.Sprintf(PulsarURL, *dataInfo.PulsarURL),
		ListenerName:   fmt.Sprintf(PulsarListener, *dataInfo.PulsarListener),
		Authentication: pulsar.NewAuthenticationToken(*dataInfo.PulsarToken),
		Logger:         pulsarLogger,
	})
	if err != nil {
		log.Println("tdmq connect error: ", err)
		return PulsarConnectError, err
	}
	defer client.Close()
	// route by invoke type
	if event.InvokeType == Timer {
		if err := timerHandler(client, *dataInfo); err != nil {
			return TimerInvokeError, err
		}
	}
	if event.InvokeType == ConsumeGroupByPartition {
		if err := dataInfo.consumerWorker(client); err != nil {
			return ConsumerInvokeError, err
		}
	}
	log.Printf("function end...\n")
	return Success, nil
}

func main() {
	// Make the handler available for Remote Procedure Call by Cloud Function
	cloudfunction.Start(process)
}
