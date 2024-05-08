let id = Shelly.getDeviceInfo().id;
let power_day = 0;
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
            power_day += result.apower;
            iteration += 1;

            if (iteration >= max_iterations) {
                let unixtime = Shelly.getComponentStatus("sys").unixtime;
                let mqtt_mess = {
                    value: power_day,
                    timestamp: unixtime
                };
                power_day = 0;
                iteration = 0;
                print(mqtt_mess)
                MQTT.publish("shellies/" + id + "/relay/0/poweragg", JSON.stringify(mqtt_mess), 0, false);
            }

        }
    );
});