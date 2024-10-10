package openai

import (
	"context"
	"log"
	"sync"

	"qqbot-demo/domain/repo/openai"

	oa "github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

var (
	onceInitOpenAI sync.Once
)

// WireUp 组装
func WireUp(apiKey string) {
	onceInitOpenAI.Do(func() {
		openai.GetInstance = func() openai.API {
			client := oa.NewClient(
				option.WithAPIKey(apiKey), // 混元 APIKey
				option.WithBaseURL("https://api.hunyuan.cloud.tencent.com/v1/"), // 混元 endpoint
			)
			return &hunYuanOpenAPI{client}
		}
	})

}

// hunYuanOpenAPI ..
type hunYuanOpenAPI struct {
	*oa.Client
}

func (api *hunYuanOpenAPI) ChatCompletions(ctx context.Context, sysPrompt string, userPrompt string) string {

	// 返回的resp是一个ChatCompletionsResponse的实例，与请求对象对应
	response, err := api.Chat.Completions.New(ctx, oa.ChatCompletionNewParams{
		Messages: oa.F([]oa.ChatCompletionMessageParamUnion{
			oa.SystemMessage(sysPrompt),
			oa.UserMessage(userPrompt),
		}),
		Model: oa.F("hunyuan-lite"),
	})
	if err != nil {
		log.Println("ChatCompletions failed: ", err)
		return err.Error()
	}
	log.Println("chat completion rsp ", response.Choices[0].Message.Content)
	return response.Choices[0].Message.Content
}
