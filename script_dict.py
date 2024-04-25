d = {
    "3EM": """// Message to be sent to the MQTT broker example:
// mqtt_message = {
//     "timestamp": "20:11:34",
//     "id": 0,
//     "a_total_act_energy": 0,
//     "a_total_act_ret_energy": 0,
//     "b_total_act_energy": 0,
//     "b_total_act_ret_energy": 0,
//     "c_total_act_energy": 0,
//     "c_total_act_ret_energy": 0,
//     "total_act": 0,
//     "total_act_ret": 0,
//     "a_current": 4.029,
//     "a_voltage": 236.1,
//     "a_act_power": 951.2,
//     "a_aprt_power": 951.9,
//     "a_pf": 1,
//     "a_freq": 50,
//     "b_current": 4.027,
//     "b_voltage": 236.201,
//     "b_act_power": -951.1,
//     "b_aprt_power": 951.8,
//     "b_pf": 1,
//     "b_freq": 50,
//     "c_current": 3.03,
//     "c_voltage": 236.402,
//     "c_active_power": 715.4,
//     "c_aprt_power": 716.2,
//     "c_pf": 1,
//     "c_freq": 50,
//     "n_current": 11.029,
//     "total_current": 11.083,
//     "total_act_power": 2484.782,
//     "total_aprt_power": 2486.7,
//     "user_calibrated_phase": [],
//     "errors": [
//         "phase_sequence"
//     ],
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


function sendMQTTMessage() {
    let EM = Shelly.getComponentStatus("EM", 0);
    let EMData = Shelly.getComponentStatus("EMData", 0);
    EM.timestamp = createTimestamp();
    let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = Object.assign({}, EM, EMData, location);
    delete mqtt_message.id
    delete mqtt_message.user_calibrated_phase
    MQTT.publish("shellies/{topic_placeholder}/3EM", JSON.stringify(mqtt_message), 0, false);
}

Timer.set({timer_period_placeholder}, true, sendMQTTMessage);"""
}
