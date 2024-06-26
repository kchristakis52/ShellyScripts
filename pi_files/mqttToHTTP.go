package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const (
	mqttBrokerAddress = "192.168.1.2"
	mqttTopic         = "fc04af0f-1a6a-49b9-aa81-95ef25296b44"
)

var (
	client mqtt.Client
)

func onConnect(client mqtt.Client) {
	fmt.Println("Connected to MQTT broker")
	client.Subscribe(mqttTopic, 0, nil)
}

func onMessageReceived(client mqtt.Client, message mqtt.Message) {

	responseTopic := message.Topic() + "/res"
	payload := string(message.Payload())
	fmt.Printf("Received message: %s\n", payload)
	if payload == "sendData" {
		cmd := exec.Command("/home/kostas/diplwmatiki/upload_data.lua")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		err := cmd.Run()
		if err != nil {
			fmt.Println("Error executing Lua script:", err)
			os.Exit(1)
		}
	} else {

		urlToHit := payload

		// Make an HTTP request
		response, err := http.Get(urlToHit)
		if err != nil {
			fmt.Printf("Error making HTTP request: %v\n", err)
			return
		}
		defer response.Body.Close()

		if response.StatusCode == http.StatusOK {
			fmt.Println("HTTP request successful")
			b, err := io.ReadAll(response.Body)
			if err != nil {
				fmt.Printf("Error reading HTTP response body: %v\n", err)
				return
			}
			fmt.Println(string(b))

			// Send a response message
			client.Publish(responseTopic, 0, false, string(b))
		} else {
			fmt.Printf("HTTP request failed with status code %d\n", response.StatusCode)
		}
	}
}

func main() {
	opts := mqtt.NewClientOptions().AddBroker(fmt.Sprintf("tcp://%s:1883", mqttBrokerAddress)).SetClientID("go-mqtt-client")
	opts.SetKeepAlive(2 * time.Second)
	opts.SetDefaultPublishHandler(onMessageReceived)
	opts.OnConnect = func(client mqtt.Client) {
		onConnect(client)
	}

	client = mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		fmt.Printf("Error connecting to MQTT broker: %v\n", token.Error())
		os.Exit(1)
	}

	defer client.Disconnect(250)

	for {
		time.Sleep(1 * time.Second)
	}
}
