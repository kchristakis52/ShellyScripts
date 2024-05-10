function createTimestamp() {
    let myDate = new Date();
    let year = myDate.getFullYear();
    let month = padZero(myDate.getMonth() + 1);
    let day = padZero(myDate.getDate());
    let hours = padZero(myDate.getHours());
    let minutes = padZero(myDate.getMinutes());
    let seconds = padZero(myDate.getSeconds());

    let formattedTimestamp = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + 'Z';

    return formattedTimestamp;
}
function padZero(number) {
    // Function to pad single-digit numbers with a leading zero
    return number < 10 ? '0' + number : number;
}


function sendMQTTMessage(sensor_id) {
    let topic_prefix = Shelly.getComponentConfig("MQTT").topic_prefix;
    let EM1 = Shelly.getComponentStatus("EM1", sensor_id);
    let EM1Data = Shelly.getComponentStatus("EM1Data", sensor_id);
    EM1.timestamp = createTimestamp();
    let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = Object.assign({}, EM1, EM1Data, location);
    delete mqtt_message.calibration
    delete mqtt_message.id
    MQTT.publish("shellies/" + topic_prefix + "/EM/relay/" + sensor_id + "/data", JSON.stringify(mqtt_message), 0, false);
}

Timer.set(1000, true, function () {
    sendMQTTMessage(0);
    sendMQTTMessage(1);
});