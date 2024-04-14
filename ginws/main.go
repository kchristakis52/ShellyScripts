package main

import (
	"fmt"
	"log"
	"net/http"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type InflightRequest struct {
	Message      string
	ResponseChan chan ResponseData
}
type ResponseData struct {
	Status  int
	Message string
}

var inflightHTTPRequests = make(map[string]InflightRequest)

func main() {
	router := gin.Default()
	mqttServerURL := "tcp://192.168.1.2:1883"
	opts := mqtt.NewClientOptions().AddBroker(mqttServerURL)
	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatal("Error connecting to MQTT:", token.Error())
	}

	wss := router.Group("/ws")
	{
		wss.GET("/:request_uuid", func(c *gin.Context) {
			requestUUID := c.Param("request_uuid")
			ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
			if err != nil {
				fmt.Println("websocket upgrade error:", err)
				return
			}
			defer ws.Close()

			inflightRequest, ok := inflightHTTPRequests[requestUUID]
			if !ok {
				fmt.Println("Request not found")
				return
			}

			ws.WriteMessage(websocket.TextMessage, []byte(inflightRequest.Message))
			delete(inflightHTTPRequests, requestUUID)

			_, message, err := ws.ReadMessage()
			if err != nil {
				fmt.Println("websocket read error:", err)

			}
			fmt.Printf("Received message: %s\n", message)
			// Process the received message here
			inflightRequest.ResponseChan <- ResponseData{
				Status:  http.StatusOK,
				Message: string(message),
			}

		})
	}

	router.POST("/mqtt_to_http", func(c *gin.Context) {
		topic := c.PostForm("gateway_uuid")
		message := c.PostForm("url")
		fmt.Printf("Received message: %s\n", message)
		requestUUID := uuid.New().String()
		responseChan := make(chan ResponseData)
		inflightHTTPRequests[requestUUID] = InflightRequest{
			Message:      message,
			ResponseChan: responseChan,
		}
		// timeout := time.Duration(5) * time.Second
		// time.AfterFunc(timeout, func() {
		// 	c.String(http.StatusRequestTimeout, "Timeout")
		// 	delete(inflightHTTPRequests, requestUUID)
		// })
		token := client.Publish(topic, 0, false, requestUUID)
		if token.Wait() && token.Error() != nil {
			log.Println("MQTT Publish Error:", token.Error())
			delete(inflightHTTPRequests, requestUUID)
			c.String(http.StatusInternalServerError, "Error")
		}
		responseData := <-responseChan
		c.JSON(responseData.Status, gin.H{"message": responseData.Message})
	})

	router.Run("192.168.1.2:8080")
}
