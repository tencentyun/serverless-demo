package config

import (
	"sync/atomic"

	"github.com/tencent-connect/botgo/token"
)

const (
	ReplyModeSimple  = 1
	ReplyModeHunyuan = 2
)

var (
	ReplyMode atomic.Uint32
)

type AppConfig struct {
	QQBot    token.QQBotCredentials `yaml:"qqbot"`
	HYApiKey string                 `yaml:"hy_api_key"`
}

// TencentCloudCredentials 腾讯云账号
type TencentCloudCredentials struct {
	SecretID  string `yaml:"secret_id"`
	SecretKey string `yaml:"secret_key"`
}

// GetAppConfig 获取应用配置信息
var GetAppConfig func() AppConfig
