let id = Shelly.getDeviceInfo().id;

Timer.set(10000, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            let mqtt_mess = {
                Timestamp: new Date().toISOString(),
                Measurements: [{
                    Value: {
                        Power: result.apower,
                        Energy: result.aenergy.total,
                        Voltage: result.voltage,
                        Current: result.current

                    }
                }]
            }
            //console.log(mqtt_mess)
            MQTT.publish("buildon/fasada/gdynia/plug/" + id, JSON.stringify(mqtt_mess), 0, false);
        }
    );
});