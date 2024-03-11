import json
import requests
import sys


def set_wifi(ssid: str, password: str, device_ip: str = "192.168.33.1") -> bool:
    """Set WiFi configuration on a Shelly device."""
    url = f"http://{device_ip}/rpc/WiFi.SetConfig"
    req = {"config": {"sta": {"ssid": ssid, "pass": password, "enable": True}}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    print(res.json())
    return res.json()["restart_required"]


def set_mqtt(
    mqtt_host: str,
    user: str | None = None,
    password: str | None = None,
    topic_prefix: str | None = None,
    device_ip: str = "192.168.33.1",
) -> bool:
    """Set MQTT configuration on a Shelly device."""
    url = f"http://{device_ip}/rpc/MQTT.SetConfig"
    req = {
        "config": {
            "enable": True,
            "server": mqtt_host,
            "user": user,
            "pass": password,
            "topic_prefix": topic_prefix,
        }
    }
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    return res.json()["restart_required"]


SYMBOLS_IN_CHUNK = 1024


def create_script(host, name):
    """Create a new script on the device and return its ID"""
    url = f"http://{host}/rpc/Script.Create"
    req = {"name": name}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    id = res.json()["id"]
    print(f"Created script {id}")
    return id


def put_chunk(host, id_, data, append=True):
    url = f"http://{host}/rpc/Script.PutCode"
    req = {"id": id_, "code": data, "append": append}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)


def autostart_script(host, id_) -> bool:
    """Start the script on the device"""
    url = f"http://{host}/rpc/Script.SetConfig"
    req = {"id": id_, "config": {"enable": True}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    return res.json()["restart_required"]


def main(
    ssid,
    wifi_password,
    mqtt_host,
    mqtt_user,
    mqtt_password,
    mqtt_topic_prefix,
    script_topic,
    script_file_path,
    device_ip="192.168.33.1",
):
    set_wifi(ssid, wifi_password, device_ip)
    set_mqtt(mqtt_host, mqtt_user, mqtt_password, mqtt_topic_prefix, device_ip)
    script_id = create_script(device_ip, script_file_path)

    with open(
        script_file_path,
        mode="r",
        encoding="utf-8",
    ) as f:
        code = f.read()
        code = code.replace("{topic_placeholder}", script_topic)
        print(code)

    pos = 0
    append = False
    print(f"total {len(code)} bytes")
    while pos < len(code):
        chunk = code[pos : pos + SYMBOLS_IN_CHUNK]
        put_chunk(device_ip, script_id, chunk, append)
        pos += len(chunk)
        append = True

    restart_required = autostart_script(device_ip, script_id)
    if restart_required:
        print("restarting")
        requests.post(f"http://{device_ip}/rpc/Shelly.Reboot")


if __name__ == "__main__":
    main(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3],
        sys.argv[4],
        sys.argv[5],
        sys.argv[6],
        sys.argv[7],
        sys.argv[8],
    )
