// Message to be sent to the MQTT broker example:
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

function timestampToTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = "0" + date.getMinutes();
    const seconds = "0" + date.getSeconds();
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

function sendMQTTMessage(result, error_code, error_message) {
    let EMData = Shelly.getComponentStatus("EMData", 0);
    delete EMData.id; // remove id from the EMData object to avoid duplicate keys
    let unix_timestamp = Shelly.getComponentStatus("sys").unixtime;
    result.timestamp = timestampToTime(unix_timestamp);
    let location = Shelly.getComponentConfig("sys").location;
    let mqtt_message = {
        ...result,
        ...EMData,
        ...location
    }
    // print(JSON.stringify(result))
    MQTT.publish("shellies/EM" + result.id, JSON.stringify(mqtt_message), 0, false);
}

Timer.set(1000, true, function () {
    Shelly.call("EM.GetStatus", { id: 0 }, sendMQTTMessage);
});