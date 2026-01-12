function commandCallback(topic, message) {
    let commandObject = JSON.parse(message);
    let id = Shelly.getDeviceInfo().id;
    let deviceID = commandObject.DeviceId;
    if (deviceID !== id) {
        return;
    }

    let value = commandObject.Actions[0].ValuesMapping.Setpoint;
    let measurementId = commandObject.Actions[0].MeasurementId;

    if (measurementId === "Brightness") {
        Shelly.call(
            "Light.Set",
            { id: 0, brightness: value }
        );
    }

    else if (measurementId === "Status") {
        Shelly.call(
            "Light.Set",
            { id: 0, on: value },

        );
    }


}

MQTT.subscribe("buildon-control/heka", commandCallback)