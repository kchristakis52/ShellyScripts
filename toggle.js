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

}

MQTT.subscribe("shellies/" + id + "/relay/0/switch", processMessage)