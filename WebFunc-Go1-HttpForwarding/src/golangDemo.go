package main

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"
)

const (
	// 控制台设置的 Token
	_settedToken = "aaa"
	// 设置的转发 path
	_httpPath = "/test"
	// 监听的端口
	_listenAddr = "0.0.0.0:9000"

	_HeaderechoStr = "Echostr"
)

func main() {
	//设置监听的端口
	http.HandleFunc(_httpPath, httpResponse)
	s := &http.Server{
		Addr:           _listenAddr, //打包到scf部署的代码监听的地址是这个
		ReadTimeout:    3 * time.Second,
		WriteTimeout:   3 * time.Second,
	}
	if err := s.ListenAndServe(); err != nil {
		log.Fatalf("listenAndServe: %+v", err)
	}

}

func httpResponse(w http.ResponseWriter, r *http.Request) {
	var (
		token           string //用户设置Token
		headerSignature string
		headerEchostr   string
		arr             []string // 存储Token、Timestamp、Nonce 三个参数
	)

	token = _settedToken
	arr = append(arr, token)
	if r.Method == http.MethodGet {
		//解析 header
		for k, v := range r.Header {
			switch k {
			case _HeaderechoStr:
				headerEchostr = v[0]
			case "Signature":
				headerSignature = v[0]
			case "Timestamp":
				arr = append(arr, v[0])
			case "Nonce":
				arr = append(arr, v[0])
			}
		}
		// 验证消息 :
		// 1)将 Token、Timestamp、Nonce 三个参数进行字典序排序
		// 2)将三个参数字符串拼接成一个字符串进行 sha1 加密
		// 3)开发者获得加密后的字符串可与 Signature 对比，标识该请求来源于物联网开发平台
		sort.Strings(arr)
		h := sha1.New()
		h.Write([]byte(strings.Join(arr, "")))
		paramsSignatureCalc := h.Sum(nil)
		if result := hex.EncodeToString(paramsSignatureCalc); result == headerSignature {
			fmt.Println("验签成功")
		} else {
			fmt.Println("验签失败")
		}

		// 返回json字符串给客户端
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		_, err := io.WriteString(w, headerEchostr)
		if err != nil {
			fmt.Println("写入失败")
			return
		}
	} else if r.Method == http.MethodPost {
		// 调用json包的解析，解析请求body
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			fmt.Print("解析失败")
			return
		}
		fmt.Println("Post Body:", string(body))
	}
	w.WriteHeader(http.StatusNotFound)
}


