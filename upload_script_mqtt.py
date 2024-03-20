import json
import time
import paho.mqtt.publish as publish
import paho.mqtt.subscribe as subscribe
import paho.mqtt.client as mqtt


SYMBOLS_IN_CHUNK = 1024
script_id = None


def create_script(shelly_id, name, mqtt_host) -> int | None:
    """Create a new script on the device and return its ID"""

    def on_connect(client, userdata, flags, rc, properties):
        client.subscribe(f"{shelly_id}/create/rpc")

    def on_message(client, userdata, msg):
        payload_dict = json.loads(msg.payload.decode("utf-8"))
        global id
        id = payload_dict["result"]["id"]
        client.disconnect()

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    # Set the callback function for connection
    client.on_connect = on_connect
    client.on_message = on_message

    create_message = {
        "id": 1,
        "src": f"{shelly_id}/create",
        "method": "Script.Create",
        "params": {"name": name},
    }
    client.connect(mqtt_host)
    client.publish(shelly_id + "/rpc", json.dumps(create_message))
    client.loop_forever()
    return id


def put_chunk(shelly_id, id_, data, mqtt_host, append=True):
    put_chunk_message = {
        "id": 1,
        "src": f"{shelly_id}/create",
        "method": "Script.PutCode",
        "params": {"id": id_, "code": data},
    }
    publish.single(
        shelly_id + "/rpc", json.dumps(put_chunk_message), hostname=mqtt_host
    )


def autostart_script(shelly_id, id_, mqtt_host):
    """Start the script on the device"""
    autostart_message = {
        "id": 1,
        "src": f"{shelly_id}/autostart",
        "method": "Script.SetConfig",
        "params": {"id": id_, "config": {"enable": True}},
    }
    publish.single(
        shelly_id + "/rpc", json.dumps(autostart_message), hostname=mqtt_host
    )


def main(shelly_id, script_file_path, mqtt_host, script_topic):
    script_id = create_script(shelly_id, script_file_path, mqtt_host)

    with open(
        script_file_path,
        mode="r",
        encoding="utf-8",
    ) as f:
        code = f.read()
        code = code.replace("{topic_placeholder}", script_topic)

    pos = 0
    append = False
    print(f"total {len(code)} bytes")
    while pos < len(code):
        chunk = code[pos : pos + SYMBOLS_IN_CHUNK]
        put_chunk(shelly_id, script_id, chunk, mqtt_host, append)
        pos += len(chunk)
        append = True
    autostart_script(shelly_id, script_id, mqtt_host)


main(
    "shellyplusplugs-3ce90e2fbe5c",
    "./shelly_scripts/test_script.js",
    "192.168.1.7",
    "test/topic",
)
