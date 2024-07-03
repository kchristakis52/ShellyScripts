function publishDataCallback() {
    Shelly.call("KVS.GetMany", { match: "trv*" }, function (result, error_code, error_message) {
        if (error_code != 0) {
            // process error
        } else {
            print(result.items)
            items = result.items
            for (let key in items) {
                if (items.hasOwnProperty(key)) {
                    console.log(key); // item1, item2
                    console.log(items[key].value); // item1 value, item2 value
                    trvData = JSON.parse(items[key].value);

                    url = "http://" + trvData.hostname + ".local/status"
                    Shelly.call(
                        "http.get",
                        { "url": url },
                        function (data, error_code, error_message) {
                            if (error_code != 0) {
                                print(error_message)
                                return;
                            }
                            body = JSON.parse(data.body)
                            print(body)
                            //responseJSON = {
                            //    hostname: trvData.hostname,
                            //    valve_position: body.thermostats[0].pos,
                            //    target_t: body.thermostats[0].target_t.value,
                            //    temperature: body.thermostats[0].tmp.value,
                            //    battery: body.bat.value,
                            //    timestamp: new Date().toISOString()
                            //}
                            responseJSON = {
                                Timestamp: new Date().toISOString(),
                                Measurements: [{
                                    Value: {
                                        Hostname: trvData.hostname,
                                        ValvePosition: body.thermostats[0].pos,
                                        TargetTemperature: body.thermostats[0].target_t.value,
                                        Temperature: body.thermostats[0].tmp.value,
                                        Battery: body.bat.value,
                                    }
                                }]
                            }
                            print(responseJSON)
                            Shelly.call("KVS.Set", { key: key, value: JSON.stringify(responseJSON) }, function (result, error_code, error_message) {
                                if (error_code != 0) {
                                    print(error_message)
                                } else {
                                    print(result)
                                }
                            })
                            print("buildon/fasada/gdynia/trv/" + trvData.hostname)
                            MQTT.publish("buildontest/fasada/gdynia/trv/" + trvData.hostname, JSON.stringify(responseJSON))

                        }
                    );
                }
            }
        }
    }
    );
}
let period = 3600000;
MQTT.subscribe("gateway_id/trv_updates", publishDataCallback)
Timer.set(period, true, publishDataCallback)