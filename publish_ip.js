let id = Shelly.getDeviceInfo().id;
print(id);



let unixtime = Shelly.getComponentStatus("sys").unixtime;
let ip = Shelly.getComponentStatus("wifi").sta_ip;
let mqtt_mess = {
    ip: ip,
    timestamp: unixtime
};
print(JSON.stringify(mqtt_mess));
MQTT.publish("shellies/" + id + "/relay/0/ip", JSON.stringify(mqtt_mess), 0, false);