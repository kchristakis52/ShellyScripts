import json
import time
import paho.mqtt.publish as publish
import paho.mqtt.subscribe as subscribe
import paho.mqtt.client as mqtt


SYMBOLS_IN_CHUNK = 1024


def create_script(shelly_id, name, mqtt_host):
    """Create a new script on the device and return its ID"""

    def on_connect(client, userdata, flags, rc, properties):
        print("Connected with result code " + str(rc))
        client.subscribe(f"{shelly_id}/create/rpc")

    def on_message(client, userdata, msg):
        payload_dict = json.loads(msg.payload.decode("utf-8"))
        print(payload_dict)
        client.loop_stop()
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
    client.loop_start()

    # Wait for the connection to be established
    while not client.is_connected():
        pass
    client.publish(shelly_id + "/rpc", json.dumps(create_message))
    time.sleep(10)

    # Stop the loop
    client.loop_stop()
    client.disconnect()
    print("mpika")


# def put_chunk(host, id_, data, append=True):
#     url = f"http://{host}/rpc/Script.PutCode"
#     req = {"id": id_, "code": data, "append": append}
#     req_data = json.dumps(req, ensure_ascii=False)
#     res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)


# def autostart_script(host, id_) -> bool:
#     """Start the script on the device"""
#     url = f"http://{host}/rpc/Script.SetConfig"
#     req = {"id": id_, "config": {"enable": True}}
#     req_data = json.dumps(req, ensure_ascii=False)
#     res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
#     return res.json()["restart_required"]


create_script("shellyplusplugs-3ce90e2fbe5c", "onoma", "192.168.1.7")
