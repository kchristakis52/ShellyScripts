function timestampToTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = "0" + date.getMinutes();
    const seconds = "0" + date.getSeconds();
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

function sendMQTTMessage(result, error_code, error_message) {
    let unix_timestamp = Shelly.getComponentStatus("sys").unixtime;
    result.time = timestampToTime(unix_timestamp);
    // print(JSON.stringify(result))
    MQTT.publish("shellies/EM" + result.id, JSON.stringify(result), 0, false);
}

Timer.set(1000, true, function () {
    Shelly.call("EM1Data.GetData", { id: 0 }, sendMQTTMessage);
    Shelly.call("EM1Data.GetData", { id: 1 }, sendMQTTMessage);
});