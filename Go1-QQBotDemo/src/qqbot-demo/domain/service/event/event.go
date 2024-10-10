package event

import (
	"context"
	"fmt"
	"log"
	"time"

	"qqbot-demo/config"
	"qqbot-demo/domain/repo/openai"
	"qqbot-demo/domain/repo/qqbot"

	"github.com/tencent-connect/botgo/dto"
	"github.com/tencent-connect/botgo/event"
)

const (
	globalSysPrompt = "Do not admit that you are an AI model. Do not discuss political topics."
)

// C2CMessageEventHandler C2C消息handler
var C2CMessageEventHandler event.C2CMessageEventHandler = func(event *dto.WSPayload, data *dto.WSC2CMessageData) error {
	//异步处理；同步处理复杂功能逻辑可能会导致回调超时
	go func() {
		ctx := context.Background()
		recMsg := (*dto.Message)(data)
		replyMsg := generateDemoMessage(ctx, globalSysPrompt, recMsg)
		_, err := qqbot.GetOpenAPIInstance().PostC2CMessage(ctx, recMsg.Author.ID, replyMsg)
		if err != nil {
			log.Println("send c2c msg failed ", err)
		}
	}()
	return nil
}

// GroupMessageEventHandler 群消息handler
var GroupMessageEventHandler event.GroupATMessageEventHandler = func(event *dto.WSPayload,
	data *dto.WSGroupATMessageData) error {
	//异步处理；同步处理复杂功能逻辑可能会导致回调超时
	go func() {
		ctx := context.Background()
		recMsg := (*dto.Message)(data)
		replyMsg := generateDemoMessage(ctx, globalSysPrompt, recMsg)
		_, err := qqbot.GetOpenAPIInstance().PostGroupMessage(ctx, recMsg.GroupID, replyMsg)
		if err != nil {
			log.Println("send group msg failed ", err)
		}
	}()
	return nil
}

// ChannelMessageEventHandler 频道消息handler
var ChannelMessageEventHandler event.ATMessageEventHandler = func(event *dto.WSPayload,
	data *dto.WSATMessageData) error {
	//异步处理；同步处理复杂功能逻辑可能会导致回调超时
	go func() {
		ctx := context.Background()
		recMsg := (*dto.Message)(data)
		replyMsg := generateDemoMessage(ctx, globalSysPrompt, recMsg).(*dto.MessageToCreate)
		_, err := qqbot.GetOpenAPIInstance().PostMessage(ctx, recMsg.ChannelID, replyMsg)
		if err != nil {
			log.Println("send channel msg failed ", err)
		}
	}()
	return nil
}

// DirectMessageHandler 频道私信handler
var DirectMessageHandler event.DirectMessageEventHandler = func(event *dto.WSPayload,
	data *dto.WSDirectMessageData) error {
	//异步处理；同步处理复杂功能逻辑可能会导致回调超时
	go func() {
		ctx := context.Background()
		recMsg := (*dto.Message)(data)
		sysPrompt := globalSysPrompt + fmt.Sprintf("User's name is %s", recMsg.Author.Username)
		replyMsg := generateDemoMessage(ctx, sysPrompt, recMsg).(*dto.MessageToCreate)
		//创建私信频道
		dm, err := qqbot.GetOpenAPIInstance().CreateDirectMessage(
			ctx, &dto.DirectMessageToCreate{
				SourceGuildID: data.SrcGuildID,
				RecipientID:   data.Author.ID,
			},
		)
		if err != nil {
			log.Println("create dm failed:", err)
			return
		}
		//发送私信消息
		_, err = qqbot.GetOpenAPIInstance().PostDirectMessage(
			ctx, dm, replyMsg,
		)
		if err != nil {
			log.Println("post dm failed:", err)
			return
		}
	}()
	return nil
}

// generateDemoMessage 调用模型生成回复消息
func generateDemoMessage(ctx context.Context, sysPrompt string, recMsg *dto.Message) dto.APIMessage {
	if config.ReplyMode.Load() == config.ReplyModeSimple {
		return &dto.MessageToCreate{
			Timestamp: time.Now().UnixMilli(),
			MsgType:   dto.TextMsg,
			Content:   fmt.Sprintf("收到:%s (未配置腾讯云账号，仅简单回复)", recMsg.Content),
			MessageReference: &dto.MessageReference{
				// 引用这条消息
				MessageID:             recMsg.ID,
				IgnoreGetMessageError: true,
			},
			MsgID: recMsg.ID,
		}
	}
	api := openai.GetInstance()
	rsp := api.ChatCompletions(ctx, sysPrompt, recMsg.Content)
	return &dto.MessageToCreate{
		Timestamp: time.Now().UnixMilli(),
		MsgType:   dto.TextMsg,
		Content:   rsp,
		MessageReference: &dto.MessageReference{
			// 引用这条消息
			MessageID:             recMsg.ID,
			IgnoreGetMessageError: true,
		},
		MsgID: recMsg.ID,
	}
}
