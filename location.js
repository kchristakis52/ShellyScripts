let id = Shelly.getDeviceInfo().id;
print(id);

let timestamp = Shelly.getComponentStatus("sys").unixtime;
let location = Shelly.getComponentConfig('sys').location;

let mqtt_mess = {
    location: location,
    timestamp: timestamp
};
print(JSON.stringify(mqtt_mess));
MQTT.publish("shellies/" + id + "/relay/0/location", JSON.stringify(mqtt_mess), 0, false);