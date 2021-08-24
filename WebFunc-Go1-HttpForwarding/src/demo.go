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


func jsonReqRsp(w http.ResponseWriter, r *http.Request) {
	var Token string
	var arr []string
	var Signature  string
	var Echostr string
	//用户设置token
	Token = "aaa"
	arr = append(arr, Token)
	if r.Method =="GET"{
		//解析 header
		if len(r.Header) > 0 {
			for k,v :=range r.Header {
				fmt.Printf("%s=%s\n", k, v[0])
				if k =="Echostr"{
					Echostr = v[0]
				}
				if k== "Signature"{
					Signature = v[0]
				}
				if k=="Timestamp"{
					arr = append(arr,string(v[0]))
				}
				if k=="Nonce"{
					arr = append(arr,string(v[0]))
				}
			}
		}
		//验签
		sort.Slice(arr, func(i, j int) bool {
			return arr[i] < arr[j]
		})
		tmpstr := strings.Join(arr,"")
		h := sha1.New()
		h.Write([]byte(tmpstr))
		tmpsignature := h.Sum(nil)
		result := hex.EncodeToString(tmpsignature)
		//fmt.Println("tmpsignature: ",result)
		if result == Signature {
			fmt.Println("验签成功")
		} else {
			fmt.Println("验签失败")
		}

		// 返回json字符串给客户端
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")
		io.WriteString(w, Echostr)
	} else if r.Method=="POST"{
		// 调用json包的解析，解析请求body
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			fmt.Println("解析失败")
			return
		}
		log.Println("Post Body: ",  string(body))
	} else {
		w.WriteHeader(404)
	}


}



func main() {
	//设置监听的端口
	http.HandleFunc("/test",jsonReqRsp)
	s := &http.Server{
		Addr:           "0.0.0.0:9000",   //打包到scf部署的代码监听的地址是这个
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}
	err := s.ListenAndServe()
	if err != nil {
		log.Fatal("listenAndServe: ", err)
	}

}
