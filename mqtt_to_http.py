import paho.mqtt.client as mqtt
import requests

# MQTT settings
mqtt_broker_address = "localhost"
mqtt_topic = "shellyplusplugs-3ce90e2fbe5c"
response_topic = f"{mqtt_topic}/res"

# HTTP request settings
url_to_hit = f"http://{mqtt_topic}.local/rpc/Switch.Toggle?id=0"


def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    client.subscribe(mqtt_topic)


def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"Received message: {payload}")

    # Make an HTTP request
    try:
        http_response = requests.get(url_to_hit)
        if http_response.status_code == 200:
            print("HTTP request successful")
            # Send a response message
            client.publish(response_topic, http_response.text)
        else:
            print(f"HTTP request failed with status code {http_response.status_code}")
    except Exception as e:
        print(f"Error making HTTP request: {e}")


# Create MQTT client
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Connect to the MQTT broker
client.connect(mqtt_broker_address)

# Start the MQTT loop
client.loop_forever()
