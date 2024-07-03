let id = Shelly.getDeviceInfo().id;

Timer.set(10000, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            let unixtime = Shelly.getComponentStatus("sys").unixtime;
            //let mqtt_mess = {
            //   power: result.apower,
            //   energy: result.aenergy.total,
            //    timestamp: new Date(unixtime*1000).toISOString()
            //};
            let mqtt_mess = {
                Timestamp: new Date(unixtime * 1000).toISOString(),
                Measurements: [{
                    Value: {
                        Power: result.apower,
                        Energy: result.aenergy.total,
                        Voltage: result.voltage,
                        Current: result.current

                    }
                }]
            }
            console.log(mqtt_mess)
            MQTT.publish("buildontest/fasada/gdynia/plug/" + id, JSON.stringify(mqtt_mess), 0, false);
        }
    );
});