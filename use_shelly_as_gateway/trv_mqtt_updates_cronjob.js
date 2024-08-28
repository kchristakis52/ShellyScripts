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

//Actual task that is to be run on a schedule
function scheduledTask() {
    Shelly.call("KVS.GetMany", { match: "trv*" }, function (result, error_code, error_message) {
        if (error_code != 0) {
            // process error
        } else {
            //print(result.items)
            items = result.items
            for (let key in items) {
                if (items.hasOwnProperty(key)) {
                    //console.log(key); // item1, item2
                    //console.log(items[key].value); // item1 value, item2 value
                    trvData = JSON.parse(items[key].value);
                    trvHostname = trvData.Measurements[0].Value.Hostname

                    url = "http://" + trvHostname + ".local/status"
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
                                        Hostname: trvHostname,
                                        ValvePosition: body.thermostats[0].pos,
                                        TargetTemperature: body.thermostats[0].target_t.value,
                                        Temperature: body.thermostats[0].tmp.value,
                                        Battery: body.bat.value,
                                    }
                                }]
                            }
                            print(JSON.stringify(responseJSON))

                            Shelly.call("KVS.Set", { key: key, value: JSON.stringify(responseJSON) }, function (result, error_code, error_message) {
                                if (error_code != 0) {
                                    print(error_message)
                                } else {
                                    //print(result)
                                }
                            })
                            print("buildon/fasada/gdynia/trv/" + trvHostname)
                            MQTT.publish("buildon/fasada/gdynia/trv/" + trvHostname, JSON.stringify(responseJSON))

                        }
                    );
                }
            }
        }
    }
    );
}