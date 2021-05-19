package main

import (
	"log"
	"os"
)

func createFile(filename string) (*os.File, error) {
	if checkFileIsExist(filename) {
		log.Printf("file exists delete it \n")
		if err := os.Remove(filename); err != nil {
			log.Printf("Delete file error: %s\n", err)
			return nil, err
		}
	}
	f, err := os.Create(filename)
	if err != nil {
		log.Printf("Create file error: %s\n", err)
		return nil, err
	}
	return f, nil
}

func checkFileIsExist(filename string) bool {
	_, err := os.Stat(filename)
	if err == nil {
		return true
	}
	if os.IsNotExist(err) {
		return false
	}
	log.Printf("file exists error: %s\n", err)
	return false
}

func appendWrite(f *os.File, data []byte) error {
	_, err := f.Write(data)
	if err != nil {
		log.Printf("append file error: %s\n", err)
		return err
	}
	return nil
}

func getFileSize(filename string) (int64, error) {
	fi, err := os.Stat(filename)
	if err != nil {
		log.Printf("get file size error: %s\n", err)
		return 0, err
	}
	return fi.Size(), nil
}
