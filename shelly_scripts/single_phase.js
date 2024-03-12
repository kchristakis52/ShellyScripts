// Message to be sent to the MQTT broker example:
// mqtt_message = {
//     "id": 0,
//     "voltage": 236.1,
//     "current": 4.029,
//     "act_power": 951.2,
//     "aprt_power": 951.9,
//     "pf": 1,
//     "freq": 50,
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
    let EM1 = Shelly.getComponentStatus("EM1", sensor_id);
    let EM1Data = Shelly.getComponentStatus("EM1Data", sensor_id);
    EM1.timestamp = createTimestamp();
    let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = Object.assign({}, EM1, EM1Data, location);
    delete mqtt_message.calibration
    delete mqtt_message.id
    if (EM1.id == 0) {
        MQTT.publish("shellies/EM/filippas", JSON.stringify(mqtt_message), 0, false);
    } else {
        MQTT.publish("shellies/thermosifonas/filippas", JSON.stringify(mqtt_message), 0, false);
    }
}

Timer.set(1000, true, function () {
    sendMQTTMessage(0);
    sendMQTTMessage(1);
});