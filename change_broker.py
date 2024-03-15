# Script gia allagh mqtt broker apomakrysmena

import json
import time
import paho.mqtt.client as mqtt


def main(
    mqtt_server: str,
    mqtt_port: int,
    shelly_id: str,
    new_mqtt_server: str,
    new_mqtt_port: int,
    new_mqtt_user: str,
    new_mqtt_password: str,
):
    def on_connect(client, userdata, flags, rc, properties):
        print("Connected with result code " + str(rc))
        client.subscribe(f"{shelly_id}/res/rpc")

    def on_message(client, userdata, msg):
        payload_dict = json.loads(msg.payload.decode("utf-8"))
        if payload_dict["result"]["restart_required"] == True:
            restart_message = {
                "id": 1,
                "src": f"{shelly_id}/restart",
                "method": "Shelly.Reboot",
            }
            client.publish(shelly_id + "/rpc", json.dumps(restart_message))
            client.disconnect()

    # Create an MQTT client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    # Set the callback function for connection
    client.on_connect = on_connect
    client.on_message = on_message

    # Connect to the MQTT broker
    client.connect(mqtt_server, mqtt_port, 60)

    # Start the MQTT loop
    client.loop_start()

    # Wait for the connection to be established
    while not client.is_connected():
        pass
    message = {
        "id": 1,
        "src": f"{shelly_id}/res",
        "method": "MQTT.SetConfig",
        "params": {
            "config": {
                "enable": True,
                "server": f"{new_mqtt_server}:{new_mqtt_port}",
                "user": new_mqtt_user,
                "pass": new_mqtt_password,
            }
        },
    }
    json_string_message = json.dumps(message)
    print(json_string_message)
    # Publish the message
    client.publish(shelly_id + "/rpc", json_string_message)
    time.sleep(10)

    # Stop the loop
    client.loop_stop()
    client.disconnect()


main(
    "192.168.1.89",
    1883,
    "shellyplusplugs-3ce90e2fbe5c",
    "asdf",
    1883,
    "username",
    "password",
)
