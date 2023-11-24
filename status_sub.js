let id = Shelly.getDeviceInfo().id;
function processMessage(topic, message, userdata) {
    if (message === 'getstatus') {
        Shelly.call(
            "switch.getstatus",
            {
                //for more than one switch devices use the respective id
                id: 0,
            },
            function (result, error_code, error_message) {
                let unixtime = Shelly.getComponentStatus("sys").unixtime;
                let mqtt_mess = {
                    switch_status: result.output,
                    timestamp: unixtime
                };

                MQTT.publish("shellies/" + id + "/relay/0", JSON.stringify(mqtt_mess), 0, false);
            }
        );
    }
}

MQTT.subscribe("shellies/" + id + "/relay/0/request", processMessage)