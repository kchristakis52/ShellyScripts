let id = Shelly.getDeviceInfo().id;
print(id);
Timer.set(1000, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            let unixtime = Shelly.getComponentStatus("sys").unixtime;
            let location = Shelly.getComponentConfig("sys").location;

            let mqtt_mess = {
                switch_status: result.output,
                timestamp: unixtime,
                location: location
            };
            print(mqtt_mess)
            MQTT.publish("shellies/" + id + "/relay/0", JSON.stringify(mqtt_mess), 0, false);
        }
    );
});