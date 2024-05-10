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


function sendMQTTMessage() {
    let topic_prefix = Shelly.getComponentConfig("MQTT").topic_prefix;
    let EM = Shelly.getComponentStatus("EM", 0);
    let EMData = Shelly.getComponentStatus("EMData", 0);
    EM.timestamp = createTimestamp();
    let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = Object.assign({}, EM, EMData, location);
    delete mqtt_message.id
    delete mqtt_message.user_calibrated_phase
    MQTT.publish("shellies/" + topic_prefix + "/3EM/data", JSON.stringify(mqtt_message), 0, false);
}

Timer.set({ timer_period_placeholder }, true, sendMQTTMessage);