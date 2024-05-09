let id = Shelly.getDeviceInfo().id;
function processMessage(topic, message, userdata) {
    if (message === "toggle") {
        Shelly.call(
            "switch." + message,
            {
                id: 0,
            }
        );
    }
    else if (message === "on" || message === "off") {
        Shelly.call(
            "switch.set",
            {
                id: 0,
                on: (message === "on")
            }
        );
    }
    let unixtime = Shelly.getComponentStatus("sys").unixtime;
    let switch_status_value = Shelly.getComponentStatus("switch:0").output
    let mqtt_mess = {
        switch_status: switch_status_value,
        timestamp: unixtime
    };
    MQTT.publish("shellies/" + id + "/relay/0", JSON.stringify(mqtt_mess), 0, false);

}

MQTT.subscribe("shellies/" + id + "/relay/0/switch", processMessage)