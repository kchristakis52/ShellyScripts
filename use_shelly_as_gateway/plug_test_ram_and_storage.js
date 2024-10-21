// let id = Shelly.getDeviceInfo().id;
let array = []

Timer.set(1000, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
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
            array.push(mqtt_mess)
            console.log(array)

        }
    );
});