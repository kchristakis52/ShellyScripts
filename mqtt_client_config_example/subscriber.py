import configparser
import paho.mqtt.client as mqtt

config = configparser.ConfigParser()
config.read("config.ini")

subscribe_topic = config.get("MQTT", "subscribe_topic")


def on_connect(client, userdata, flags, rc, properties):
    if rc == 0:
        print("Connected to MQTT broker")
        # Subscribe to a topic
        client.subscribe(subscribe_topic)
    else:
        print("Failed to connect, return code: ", rc)


def on_message(client, userdata, msg):
    print("Received message: ", msg.payload.decode())


def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Unexpected disconnection")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

client.on_connect = on_connect
client.on_message = on_message
client.on_disconnect = on_disconnect

broker_address = "192.168.1.2"
broker_port = 1883

client.connect(broker_address, broker_port)

client.loop_forever()
