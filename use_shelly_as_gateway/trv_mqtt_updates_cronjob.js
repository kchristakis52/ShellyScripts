// This script will register itself to be called by the schedule service
// on the Shelly it is running on.
// Change SCHEDULE_TIMESPEC according to your needs
// Function that will be executed is scheduledTask()

let CONFIG = {
    KVS_KEY: "Script-Schedule-" + JSON.stringify(Shelly.getCurrentScriptId()),
    SCHEDULE_TIMESPEC: "0 0 * * * *",
    SCHEDULE_ID: -1,
};

function registerIfNotRegistered() {
    print("Reading from ", CONFIG.KVS_KEY);
    Shelly.call(
        "KVS.Get",
        {
            key: CONFIG.KVS_KEY,
        },
        function (result, error_code, error_message) {
            print("Read from KVS", JSON.stringify(error_code));
            //we are not registered yet
            if (error_code !== 0) {
                installSchedule();
                return;
            }
            CONFIG.SCHEDULE_ID = result.value;
            //check if the schedule was deleted and reinstall
            Shelly.call("Schedule.List", {}, function (result) {
                let i = 0;
                for (i = 0; i < result.jobs.length; i++) {
                    if (result.jobs[i].id === CONFIG.SCHEDULE_ID) return;
                }
                installSchedule();
            });
        }
    );
}

function saveScheduleIDInKVS(scheduleId) {
    Shelly.call("KVS.Set", {
        key: CONFIG.KVS_KEY,
        value: scheduleId,
    });
}

function installSchedule() {
    Shelly.call(
        "Schedule.Create",
        {
            enable: true,
            timespec: CONFIG.SCHEDULE_TIMESPEC,
            calls: [
                {
                    method: "script.eval",
                    params: {
                        id: Shelly.getCurrentScriptId(),
                        code: "scheduledTask()",
                    },
                },
            ],
        },
        function (result) {
            //save a record that we are registered
            saveScheduleIDInKVS(result.id);
        }
    );
}

registerIfNotRegistered();

function processHTTPData(data, error_code, error_message, userdata) {
    let trvHostname = userdata.trvHostname;
    let key = userdata.key;
    if (error_code != 0) {
        print(error_message)
        MQTT.publish("debug/" + trvHostname + "error", JSON.stringify(error_message), 1, true)
        return;
    }
    MQTT.publish("debug/" + trvHostname + "/body", JSON.stringify(data.body), 1, true)
    let body = JSON.parse(data.body)

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
    }
    MQTT.publish("buildon/fasada/gdynia/trv/" + trvHostname, JSON.stringify(responseJSON), 1, true)

    Shelly.call("KVS.Set", { key: key, value: JSON.stringify(responseJSON) }, function (result, error_code, error_message) {
        if (error_code != 0) {
            print(error_message)
        } else {
            //print(result)
        }
    })


};

function processKVSData(result, error_code, error_message) {
    if (error_code != 0) {
        // process error
        MQTT.publish("debug", error_message, 1, true)
    } else {
        //print(result.items)
        MQTT.publish("debug", JSON.stringify(result.items), 1, true)
        let items = result.items
        for (let key in items) {
            if (items.hasOwnProperty(key)) {
                //console.log(key); // item1, item2
                //console.log(items[key].value); // item1 value, item2 value
                MQTT.publish("debug/key", key, 1, true)
                MQTT.publish("debug/value", items[key].value, 1, true)
                let trvData = JSON.parse(items[key].value);
                let trvHostname = trvData.Measurements[0].Value.Hostname

                let url = "http://" + trvHostname + "/status"
                MQTT.publish("debug/" + trvHostname + "/url", url, 1, true)
                let userdata = { "trvHostname": trvHostname, "key": key };

                Shelly.call(
                    "http.get",
                    { "url": url }, processHTTPData, userdata);
            }
        }
    }

};
//Actual task that is to be run on a schedule

function scheduledTask() {
    Shelly.call("KVS.GetMany", { match: "trv/*/*" }, processKVSData);
}