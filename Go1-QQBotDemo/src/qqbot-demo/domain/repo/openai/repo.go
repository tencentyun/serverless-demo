package openai

import "context"

// API DEMO。如果需要可自行实现openai的接口定义
type API interface {
	ChatCompletions(ctx context.Context, sysPrompt string, userPrompt string) string
}

// GetInstance ..
var GetInstance func() API
