# 压缩包解压

## 简介

本示例通过配置COS触发，上传到COS的压缩包，使用SCF下载并本地解压，支持中文字段解压，并把解压后的文件上传到COS另一个targetBucket环境变量指定的存储桶中，支持如下压缩格式：ZIP, RAR, 7Z, BZIP2, GZIP, TAR, XZ

## 快速开始

1. [安装](#1-安装)
2. [配置](#2-配置)
3. [部署](#3-部署)
4. [移除](#4-移除)


### 1. 安装

通过npm安装 Serverless Framework

```console
$ npm install -g serverless
```

确保您的 Serverless Framework 不低于以下版本：

```shell
$ serverless –v
Framework Core: 1.76.1
Plugin: 3.6.17
SDK: 2.3.1
Components: 2.33.0
```


### 2. 配置

通过如下命令直接初始化该模版：

```
serverless init -t python2-unpackanduploadtocos
```

### 3. 部署

通过`sls deploy`命令进行部署，并可以添加`--debug`参数查看部署过程中的信息

如您的账号未[登陆](https://cloud.tencent.com/login)或[注册](https://cloud.tencent.com/register)腾讯云，您可以直接通过`微信`扫描命令行中的二维码进行授权登陆和注册。

### 4. 移除

可以通过以下命令移除 压缩包解压

```console
$ sls remove 

serverless ⚡ framework
Action: "remove" - Stage: "dev" - App: "python2-unpackanduploadtocos" - Instance: "ap-guangzhou_default_python2-unpackanduploadtocos"

6s › api-service › Success
  
```

### 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```console
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 SecretId 和 SecretKey 信息并保存

如果没有腾讯云账号，可以在此[注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在[API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```