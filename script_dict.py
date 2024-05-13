d = {
    "3_phase": """function createTimestamp() {
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

Timer.set({ timer_period_placeholder }, true, sendMQTTMessage);""",
    "single_phase": """function createTimestamp() {
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
});""",
    "plug_power": """let id = Shelly.getDeviceInfo().id;
Timer.set({timer_period_placeholder}, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            let unixtime = Shelly.getComponentStatus("sys").unixtime;
            let mqtt_mess = {
                value: result.apower,
                timestamp: unixtime
            };
            print(JSON.stringify(mqtt_mess))
            MQTT.publish("shellies/" + id + "/relay/0/power", JSON.stringify(mqtt_mess), 0, false);
        }
    );
});""",
    "plug_energy": """let id = Shelly.getDeviceInfo().id;
Timer.set({timer_period_placeholder}, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            let unixtime = Shelly.getComponentStatus("sys").unixtime;
            let mqtt_mess = {
                value: result.apower,
                timestamp: unixtime
            };
            print(JSON.stringify(mqtt_mess))
            MQTT.publish("shellies/" + id + "/relay/0/power", JSON.stringify(mqtt_mess), 0, false);
        }
    );
});""",
    "plug_command": """let id = Shelly.getDeviceInfo().id;
function processMessage(topic, message, userdata) {
    if (message === "toggle") {
        Shelly.call(
            "switch." + message,
            {
                id: 0,
            }
        );
    }
    else if (message === "on" || message === "off") {
        Shelly.call(
            "switch.set",
            {
                id: 0,
                on: (message === "on")
            }
        );
    }
    let unixtime = Shelly.getComponentStatus("sys").unixtime;
    let switch_status_value = Shelly.getComponentStatus("switch:0").output
    let mqtt_mess = {
        switch_status: switch_status_value,
        timestamp: unixtime
    };
    MQTT.publish("shellies/" + id + "/relay/0", JSON.stringify(mqtt_mess), 0, false);

}

MQTT.subscribe("shellies/" + id + "/relay/0/switch", processMessage)""",
    "plug_status": """let id= Shelly.getDeviceInfo().id;
print(id);
Timer.set({timer_period_placeholder}, true, function () {
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
            
            MQTT.publish("shellies/"+id+"/relay/0", JSON.stringify(mqtt_mess), 0, false);            
        }
    );
});""",
    "toggle_em_switch": """let topic_prefix = Shelly.getComponentConfig("MQTT").topic_prefix;
function processMessage(topic, message, userdata) {
    if (message === "toggle") {
        Shelly.call(
            "switch." + message,
            {
                id: 0,
            }
        );
    }
    else if (message === "on" || message === "off") {
        Shelly.call(
            "switch.set",
            {
                id: 0,
                on: (message === "on")
            }
        );
    }
    let unixtime = Shelly.getComponentStatus("sys").unixtime;
    let switch_status_value = Shelly.getComponentStatus("switch:0").output
    let mqtt_mess = {
        switch_status: switch_status_value,
        timestamp: unixtime
    };
    MQTT.publish("shellies/" + topic_prefix + "/EM/switch/response", JSON.stringify(mqtt_mess), 0, false);

}

MQTT.subscribe("shellies/" + topic_prefix + "/EM/switch", processMessage)""",
}
