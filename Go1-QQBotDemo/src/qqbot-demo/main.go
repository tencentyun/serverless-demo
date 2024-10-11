package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"qqbot-demo/config"
	des "qqbot-demo/domain/service/event"
	"qqbot-demo/infra/repoimpl/openai"
	"qqbot-demo/infra/repoimpl/qqbot"

	"github.com/tencent-connect/botgo/event"
	"github.com/tencent-connect/botgo/interaction/webhook"
	"github.com/tencent-connect/botgo/token"
)

const (
	host_ = "0.0.0.0"
	port_ = 9000
	path_ = "/qqbot"
)

func init() {
	if !initByEnv() {
		log.Fatal("init failed")
	}
}

func initByEnv() bool {
	qqBotAppid := os.Getenv("QQBotAppID")
	qqBotSecret := os.Getenv("QQBotSecret")
	if qqBotAppid == "" || qqBotSecret == "" {
		log.Println("initByEnv: QQBot AppID or Secret is not set")
		return false
	}
	hyApiKey := os.Getenv("HYApiKey")
	if hyApiKey == "" {
		log.Println("initByEnv: hunyuan api key is not set")
		config.ReplyMode.Store(config.ReplyModeSimple)
	} else {
		config.ReplyMode.Store(config.ReplyModeHunyuan)
	}
	config.GetAppConfig = func() config.AppConfig {
		return config.AppConfig{
			QQBot: token.QQBotCredentials{
				AppID:     qqBotAppid,
				AppSecret: qqBotSecret,
			},
			HYApiKey: hyApiKey,
		}
	}
	return true
}

func main() {
	//注册事件处理handler
	event.RegisterHandlers(
		des.C2CMessageEventHandler,
		des.GroupMessageEventHandler,
		des.ChannelMessageEventHandler,
		des.DirectMessageHandler,
	)
	appConf := config.GetAppConfig()
	//启动http服务监听端口
	http.HandleFunc(path_, func(writer http.ResponseWriter, request *http.Request) {
		webhook.HTTPHandler(writer, request, &appConf.QQBot)
	})
	wireUp(appConf)
	if err := http.ListenAndServe(fmt.Sprintf("%s:%d", host_, port_), nil); err != nil {
		log.Fatal("setup server fatal:", err)
	}
}

// wireUp 注入
func wireUp(appConf config.AppConfig) {
	qqbot.WireUp(appConf.QQBot.AppID, appConf.QQBot.AppSecret)
	openai.WireUp(appConf.HYApiKey)
}
