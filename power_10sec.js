let id= Shelly.getDeviceInfo().id;
print(id);
Timer.set(10000, true, function () {
    Shelly.call(
        "switch.getstatus",
        {
            //for more than one switch devices use the respective id
            id: 0,
        },
        function (result, error_code, error_message) {            
            let unixtime = Shelly.getComponentStatus("sys").unixtime;
            let mqtt_mess = {
                apower: result.apower,
                timestamp: unixtime
            };          
            print(JSON.stringify(mqtt_mess))
            MQTT.publish("shellies/"+id+"/relay/0/power", JSON.stringify(mqtt_mess), 0, false);            
        }
    );
});