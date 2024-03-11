// Message to be sent to the MQTT broker example:
// mqtt_message = {
//     "id": 0,
//     "voltage": 236.1,
//     "current": 4.029,
//     "act_power": 951.2,
//     "aprt_power": 951.9,
//     "pf": 1,
//     "freq": 50,
//     "calibration": "factory",
//     "errors": [
//         "out_of_range:current"
//     ],
//     "total_act_energy": 0,
//     "total_act_ret_energy": 0,
//     "timestamp": "20:11:34",
//     "tz": "Europe/Sofia",
//     "lat": 42.6534,
//     "lon": 23.31119

// }


function timestampToTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = "0" + date.getMinutes();
    const seconds = "0" + date.getSeconds();
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

function sendMQTTMessage(result, error_code, error_message) {
    let EM1Data = Shelly.getComponentStatus("EM1Data", result.id);
    delete EM1Data.id; // remove id from the EM1Data object to avoid duplicate keys
    let unix_timestamp = Shelly.getComponentStatus("sys").unixtime;
    result.timestamp = timestampToTime(unix_timestamp);
    let location = Shelly.getComponentConfig("sys").location;
    let temp_object = Object.assign(result, location)
    let mqtt_message = Object.assign(temp_object, EM1Data)
    // print(JSON.stringify(result))
    MQTT.publish("shellies/EM" + result.id, JSON.stringify(mqtt_message), 0, false);
}

Timer.set(1000, true, function () {
    Shelly.call("EM1.GetStatus", { id: 0 }, sendMQTTMessage);
    Shelly.call("EM1.GetStatus", { id: 1 }, sendMQTTMessage);
});