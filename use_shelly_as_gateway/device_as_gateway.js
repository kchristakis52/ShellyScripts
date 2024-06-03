function processMessage(topic, message, userdata) {
    messageObject = JSON.parse(message)
    let url = ""
    if (messageObject.device_type == "trv") {
        if (messageObject.action == "target_temperature") {
            url = "http://" + messageObject.id + "/settings/thermostats/0?target_t=" + messageObject.value
        }
        else if (messageObject.action == "valve_position") {
            url = "http://" + messageObject.id + "/thermostats/0?pos=" + messageObject.value
        }
    }
    else if (messageObject.device_type == "plug") {
        url = "http://" + messageObject.id + "/relay/0?turn=" + messageObject.value
    }
    Shelly.call(
        "http.get",
        { "url": url },
        function (data, error_code, error_message) {
            if (error_code) {

                print(error_message)
                return;
            }
            print(data)

        }
    );
}
//Allagh se kati opws device_id h mqtt topic prefix?
MQTT.subscribe("gateway_id", processMessage)

// For use see demo.py