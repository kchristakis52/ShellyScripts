import json
import requests


def set_wifi(ssid: str, password: str, device_ip: str = "192.168.33.1"):
    """Set WiFi configuration on a Shelly device."""
    url = f"http://{device_ip}/rpc/WiFi.SetConfig"
    req = {"config": {"sta": {"ssid": ssid, "pass": password, "enable": "true"}}}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    print(res.json())


def set_mqtt(
    mqtt_host: str,
    user: str | None = None,
    password: str | None = None,
    device_ip: str = "192.168.33.1",
):
    """Set MQTT configuration on a Shelly device."""
    url = f"http://{device_ip}/rpc/MQTT.SetConfig"
    req = {
        "config": {
            "enable": True,
            "server": mqtt_host,
            "user": user,
            "pass": password,
        }
    }
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    if res.json()["restart_required"] == True:
        requests.post(f"http://{device_ip}/rpc/Shelly.Reboot")


def main():
    set_mqtt("192.168.1.7", device_ip="shellyplusplugs-3ce90e2fbe5c.local")


if __name__ == "__main__":
    main()
