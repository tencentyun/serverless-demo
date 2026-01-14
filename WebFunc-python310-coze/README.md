# Python Coze 快速开始

必填环境变量

bot_id : Optional[str]
  Bot ID for Coze conversations. If not provided, will use COZE_BOT_ID
  environment variable.
user_id : Optional[str]
  User ID for Coze conversations. If not provided, will use COZE_USER_ID
  environment variable.
parameters : Optional[dict]
  Optional parameters for Coze chat API (e.g., temperature, max_tokens).
  Can also be set via COZE_PARAMETERS environment variable as JSON string.
