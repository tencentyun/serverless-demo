package main

import (
	"fmt"
	"log"
	"net/http"
)

var (
	host_ = "0.0.0.0"
	port_ = 9000
)

func main() {
	http.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {
		log.Println("Hello World")
		rw.Write([]byte("Hello World"))
	})
	err := http.ListenAndServe(fmt.Sprintf("%s:%d", host_, port_), nil)
	if err != nil {
		log.Fatal("setup server fatal:", err)
	}
}
