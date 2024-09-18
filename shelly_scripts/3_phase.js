function sendMQTTMessage() {
    let topic_prefix = Shelly.getComponentConfig("MQTT").topic_prefix;
    let EM = Shelly.getComponentStatus("EM", 0);
    let EMData = Shelly.getComponentStatus("EMData", 0);
    let unixtime = Shelly.getComponentStatus("sys").unixtime;
    let tms = new Date(unixtime * 1000).toISOString();
    //let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = Object.assign({}, EM, EMData);
    delete mqtt_message.id
    delete mqtt_message.user_calibrated_phase
    let payload = {
        "Timestamp": tms,
        "Measurements": [
            {
                "Value": mqtt_message

            }
        ]
    }

    MQTT.publish("buildon/fasada/gdynia/3em/" + topic_prefix, JSON.stringify(payload), 0, false);
}

Timer.set(10000, true, sendMQTTMessage);