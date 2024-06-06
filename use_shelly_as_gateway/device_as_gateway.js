function processMessage(topic, message, userdata) {
    messageObject = JSON.parse(message)
    let url = ""
    let res_url = ""
    if (messageObject.device_type == "trv") {
        if (messageObject.action == "target_temperature") {
            url = "http://" + messageObject.id + "/settings/thermostats/0?target_t=" + messageObject.value
        }
        else if (messageObject.action == "valve_position") {
            url = "http://" + messageObject.id + "/thermostats/0?pos=" + messageObject.value
        }
        res_url = "http://" + messageObject.id + "/status"
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
            if (res_url == "") {
                MQTT.publish("response_topic", JSON.stringify(data.body))
                return;
            }
            else {
                Shelly.call(
                    "http.get",
                    { "url": res_url },
                    function (data, error_code, error_message) {
                        if (error_code != 0) {
                            print(error_message)
                            return;
                        }
                        body = JSON.parse(data.body)
                        print(body)
                        responseJSON = {
                            thermostats: body.thermostats,
                            battery: body.bat
                        }
                        MQTT.publish("response_topic", JSON.stringify(responseJSON))
                    }
                );
            }
        }
    );
}
//Allagh se kati opws device_id h mqtt topic prefix?
MQTT.subscribe("gateway_id", processMessage)

// For use see demo.py