Timer.set(10000, true, function () {

    let sysstatus = Shelly.getComponentStatus("sys");
    let switchstatus = Shelly.getComponentStatus("switch:0");
    let object = {
        ram_free: sysstatus.ram_free,
        ram_size: sysstatus.ram_size,
        fs_size: sysstatus.fs_size,
        fs_free: sysstatus.fs_free,
        internal_temp: switchstatus.temperature.tC,
    };
    MQTT.publish("paper/system/status", JSON.stringify(object), 0, false);


});