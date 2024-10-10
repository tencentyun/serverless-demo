package qqbot

import (
	"context"
	"log"
	"sync"
	"time"

	"qqbot-demo/domain/repo/qqbot"

	"github.com/tencent-connect/botgo"
	"github.com/tencent-connect/botgo/openapi"
	"github.com/tencent-connect/botgo/token"
)

var (
	onceInitAPI sync.Once
)

// WireUp ..
func WireUp(appID string, secret string) {
	onceInitAPI.Do(func() {
		tokenSource := token.NewQQBotTokenSource(&token.QQBotCredentials{
			AppID:     appID,
			AppSecret: secret,
		})
		if err := token.StartRefreshAccessToken(context.Background(), tokenSource); err != nil {
			log.Fatalln(err)
		}
		// 初始化 openapi，正式环境
		api := botgo.NewOpenAPI(appID, tokenSource).WithTimeout(5 * time.Second).SetDebug(true)
		qqbot.GetOpenAPIInstance = func() openapi.OpenAPI {
			return api
		}
	})
}
