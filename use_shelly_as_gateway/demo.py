import json
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish

# Example MQTT payloads
# Change valve position (TRV)
change_valve_position = {
    "id": "shellytrv-60a423db07a6",
    "device_type": "trv",
    "action": "valve_position",
    "value": 20,
}
# Change target temperature (TRV)
change_target_temperature = {
    "id": "shellytrv-60a423db07a6",
    "device_type": "trv",
    "action": "target_temperature",
    "value": 10,
}
# Change relay state (Shelly Plug) (value can be "on", "off" or "toggle")
change_relay_state = {
    "id": "shellyplusplugs-3ce90e2fbe5c",
    "device_type": "plug",
    "value": "toggle",
}


def main(broker_ip: str, topic: str, message: str):
    publish.single(topic, message, hostname=broker_ip)


main(
    "192.168.1.9",
    "gateway_id",
    json.dumps(change_target_temperature),
)
