import hashlib
import json
from time import sleep
from requests.auth import HTTPDigestAuth
import requests
import sys
from script_dict import d


def set_wifi(ssid: str, password: str, device_ip: str = "192.168.33.1") -> bool:
    """Set WiFi configuration on a Shelly device."""
    url = f"http://{device_ip}/rpc/WiFi.SetConfig"
    req = {"config": {"sta": {"ssid": ssid, "pass": password, "enable": True}}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    print(res.json())
    return res.json()["restart_required"]


def update_firmware(device_ip: str = "192.168.33.1"):
    url = f"http://{device_ip}/rpc/Shelly.Update"
    req = {"stage": "stable"}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)


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


def autostart_script(host: str, id_) -> bool:
    """Start the script on the device"""
    url = f"http://{host}/rpc/Script.SetConfig"
    req = {"id": id_, "config": {"enable": True}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    return res.json()["restart_required"]


def get_local_hostname(device_ip: str) -> str:
    url = f"http://{device_ip}/rpc/Shelly.GetDeviceInfo"
    res = requests.get(url, timeout=2)
    return res.json()["id"]


def close_access_point(device_ip: str, front_end_password: str | None = None) -> bool:
    url = f"http://{device_ip}/rpc/Wifi.SetConfig"
    req = {"config": {"ap": {"enable": False}}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(
        url,
        data=req_data.encode("utf-8"),
        timeout=5,
        auth=HTTPDigestAuth("admin", front_end_password),
    )
    return res.json()["restart_required"]


def set_authentication(
    device_id: str, password: str, device_ip: str = "192.168.1.33"
) -> None:
    url = f"http://{device_ip}/rpc/Shelly.SetAuth"
    data = f"admin:{device_id}:{password}"
    sha_signature = hashlib.sha256(data.encode()).hexdigest()
    req = {"user": "admin", "realm": device_id, "ha1": sha_signature}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=10)


def main(
    ssid: str,
    wifi_password: str,
    mqtt_host: str,
    mqtt_user: str,
    mqtt_password: str,
    mqtt_topic_prefix: str,
    script_name: str,
    script_upadte_period: str,
    front_end_password: str,
    device_ip: str = "192.168.33.1",
):
    set_wifi(ssid, wifi_password, device_ip)
    update_firmware(device_ip)

    # wait for update to finish
    sleep(60)

    set_mqtt(mqtt_host, mqtt_user, mqtt_password, mqtt_topic_prefix, device_ip)
    script_id = create_script(device_ip, script_name)

    # read from dictionary
    code = d[script_name]
    code = code.replace("{timer_period_placeholder}", script_upadte_period)
    print(code)

    pos = 0
    append = False
    print(f"total {len(code)} bytes")
    while pos < len(code):
        chunk = code[pos : pos + SYMBOLS_IN_CHUNK]
        put_chunk(device_ip, script_id, chunk, append)
        pos += len(chunk)
        append = True
    autostart_script(device_ip, script_id)

    local_hostname = get_local_hostname(device_ip)
    set_authentication(local_hostname, front_end_password, device_ip)

    restart_required = close_access_point(device_ip)

    if restart_required:
        print("restarting")
        requests.post(
            f"http://{device_ip}/rpc/Shelly.Reboot",
            HTTPDigestAuth("admin", front_end_password),
        )


if __name__ == "__main__":
    # main(
    #     ssid="ssid",
    #     wifi_password="pass",
    #     mqtt_host="mqtt_host",
    #     mqtt_user=None,
    #     mqtt_password=None,
    #     mqtt_topic_prefix=None,
    #     script_name="3EM",
    #     device_ip="shellyplusplugs-3ce90e2fbe5c.local",
    # )
    # set_authentication(
    #     "shellyplusplugs-3ce90e2fbe5c", "root", "shellyplusplugs-3ce90e2fbe5c.local"
    # )
    close_access_point("shellyplusplugs-3ce90e2fbe5c.local")
