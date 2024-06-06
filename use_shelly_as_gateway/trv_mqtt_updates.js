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
                    console.log(items[key].etag); // 0DWty8HwCB, 0DMHqWL0P0
                    console.log(items[key].value); // item1 value, item2 value
                    url = "http://" + items[key].value + ".local/status"
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
                            responseJSON = {
                                thermostats: body.thermostats,
                                battery: body.bat
                            }
                            MQTT.publish("trv_data", JSON.stringify(responseJSON))

                        }
                    );
                }
            }
        }
    }
    );
}
let period = 60000;
MQTT.subscribe("gateway_id/trv_updates", publishDataCallback)
Timer.set(period, true, publishDataCallback)