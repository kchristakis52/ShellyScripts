let CONFIG = {
    switchId: 0,
    interval: 4000,
    MQTTPublishTopic: "/status/switch:",
};

Timer.set(CONFIG.interval, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {
            print(JSON.stringify(result));
            //if we need to check the state of the switch
            //peek into result.output
            print(result.apower)
            print(result.aenergy.total)
            let mqtt_mess = {
                'apower': result.apower,
                'aenergy_total': result.aenergy.total

            }

            //MQTT.publish("hello/world", JSON.stringify(result), 0, false);
            MQTT.publish("hello/world", JSON.stringify(mqtt_mess), 0, false);
            if (result.output === true) {
                print("Switch is on");
            }


        }
    );
});