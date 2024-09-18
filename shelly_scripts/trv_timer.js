function get_request(trvHostname) {
    let url = "http://" + trvHostname + "/status"
    Shelly.call(
        "http.get",
        { "url": url },
        function (data, error_code, error_message) {
            if (error_code != 0) {
                print(error_message)
                MQTT.publish("debug/" + trvHostname + "error", JSON.stringify(error_message), 1, true);
                return;
            }
            MQTT.publish("debug/" + trvHostname + "/body", JSON.stringify(data.body), 1, true);
            let body = JSON.parse(data.body);

            let responseJSON = {
                Timestamp: new Date().toISOString(),
                Measurements: [{
                    Value: {
                        Hostname: trvHostname,
                        ValvePosition: body.thermostats[0].pos,
                        TargetTemperature: body.thermostats[0].target_t.value,
                        Temperature: body.thermostats[0].tmp.value,
                        Battery: body.bat.value,
                    }
                }]
            };
            return responseJSON;
        });
};
function scheduledTask() {
    Shelly.call("KVS.GetMany", { match: "trv/*/*" }, function (result, error_code, error_message) {
        if (error_code != 0) {
            // process error
            MQTT.publish("debug", error_message, 1, true)
        } else {
            MQTT.publish("debug", JSON.stringify(result.items), 1, true)
            let items = result.items
            for (let key in items) {
                if (items.hasOwnProperty(key)) {
                    //console.log(key); // item1, item2
                    //console.log(items[key].value); // item1 value, item2 value
                    MQTT.publish("debug/key", key, 1, true)
                    MQTT.publish("debug/value", items[key].value, 1, true)
                    let trvData = JSON.parse(items[key].value);
                    let trvHostname = trvData.Measurements[0].Value.Hostname;
                    MQTT.publish("debug/" + trvHostname + "/url", url, 1, true);
                    let responseJSON = get_request(trvHostname);
                    MQTT.publish("buildon/fasada/gdynia/trv/" + trvHostname, JSON.stringify(responseJSON), 1, true)

                    Shelly.call("KVS.Set", { key: key, value: JSON.stringify(responseJSON) }, function (result, error_code, error_message) {
                        if (error_code != 0) {
                            print(error_message)
                        } else {
                            //print(result)
                        }
                    })



                }

            }
        }
    }
    );
}
let period = 30000;

Timer.set(period, true, scheduledTask)