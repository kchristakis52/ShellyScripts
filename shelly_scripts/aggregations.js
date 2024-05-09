let id = Shelly.getDeviceInfo().id;
let power_array = [];
let period = 10000;
let iteration = 0;
// 60000ms = 1 minute
let max_iterations = 60000 / period;
Timer.set(period, true, function () {
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
            power_array.push(mqtt_mess);
            iteration += 1;

            if (iteration >= max_iterations) {
                print(JSON.stringify(power_array))
                MQTT.publish("shellies/" + id + "/relay/0/poweragg", JSON.stringify(power_array), 0, false);
                power_array = [];
                iteration = 0;
            }

        }
    );
});