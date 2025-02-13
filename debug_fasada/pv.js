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
let ShellyCallQ = {
    // Shelly scripting is said to restrict the number of simultaneous unfinished
    // Shelly.call() operations to five at most, hence this queueing mechanism.

    // Note: "dieses" is German for "this" because "this" doesn't seem to work in
    // callback functions or functions that they call, at least not with the mJS
    // JavaScript interpreter in pre-1.0.0 firmware.

    _unstarted_q: [],

    _unfinished: 0,
    _max_unfinished: 4,
    // If you want to force serialization of the calls, that is, the previous
    // Shelly.call must finish before the next Shelly.call starts, you can
    // set _max_unfinished here to 1.

    _mem_in_use: 0,
    _max_mem: 25000,
    _default_est_mem_usage: 5000,
    // Apparently another internal limitation is that the memory usage of a single
    // Shelly.call cannot exceed 15KB, and the aggregate memory usage of unfinished
    // Shelly.calls cannot exceed 25KB. It's unclear exactly what constitutes
    // memory usage, but it does include JSON in and out.

    _call_finished: function (response, error_code, error_message, data) {
        if (typeof (data.call.callback_fn) === "function") {
            data.call.callback_fn(response, error_code, error_message, data.call.callback_args);
        }
        let dieses = data.dieses;
        dieses._unfinished -= 1;
        dieses._mem_in_use -= data.call.est_mem_usage;
        dieses._check_queue(dieses);
    },

    _check_queue: function (dieses) {
        while (
            (0 < dieses._unstarted_q.length) &&
            (dieses._unfinished < dieses._max_unfinished) &&
            ((dieses._mem_in_use + dieses._unstarted_q[0].est_mem_usage) < dieses._max_mem)
        ) {
            let call = dieses._unstarted_q.splice(0, 1)[0];
            dieses._unfinished += 1;
            dieses._mem_in_use += call.est_mem_usage;
            Shelly.call(
                call.cmd,
                call.args,
                dieses._call_finished,
                {
                    dieses: dieses,
                    call: call,
                }
            ); // Shelly.call is non-blocking,
            // completion is reported to dieses.call_finished
        }
    },

    add_calls: function (ary) {
        if (typeof (ary) === "object") {
            for (let i = 0; i < ary.length; i++) {
                this._unstarted_q.push(ary[i]);
            }
            this._check_queue(this);
        }
    },

    build_call: function (cmd, args, callback_fn, callback_args, est_mem_usage) {
        return {
            cmd: cmd,
            args: args,
            callback_fn: callback_fn,
            callback_args: callback_args,
            est_mem_usage: (
                (est_mem_usage === undefined) ?
                    this._default_est_mem_usage :
                    est_mem_usage),
        };
    }
};

function processHTTPData(data, error_code, error_message, userdata) {
    try {
        let trvHostname = userdata.trvHostname;

        if (error_code !== 0) {
            print(error_message);
            MQTT.publish("debug/" + trvHostname + "/error", JSON.stringify(error_message), 1, true);
            return;
        }

        MQTT.publish("debug/" + trvHostname + "/body", JSON.stringify(data.body), 1, true);
        let body = JSON.parse(data.body);

        let responseJSON = {
            Timestamp: new Date().toISOString(),
            Measurements: [{
                Value: {
                    ValvePosition: body.thermostats[0].pos,
                    TargetTemperature: body.thermostats[0].target_t.value,
                    Temperature: body.thermostats[0].tmp.value,
                    Battery: body.bat.value,
                }
            }]
        };
        MQTT.publish("buildon/fasada/gdynia/trv/" + trvHostname, JSON.stringify(responseJSON), 1, false);
    } catch (err) {
        print("Error in processHTTPData: ", err);
        MQTT.publish("bug/1", JSON.stringify(err), 1, true);
    }
}

function hitTRVs(trvs) {
    try {
        let call_group_info = {
            calls_to_issue: [],
            unfinished_calls: 0,
            call_results: {},
        };

        for (let i = 0; i < trvs.length; i++) {
            let trvHostname = trvs[i];
            let url = "http://" + trvHostname + "/status";
            let userdata = { "trvHostname": trvHostname };
            call_group_info.calls_to_issue.push(ShellyCallQ.build_call(
                "HTTP.GET",
                { url: url, timeout: 25 },
                processHTTPData,
                userdata
            ));
        }

        MQTT.publish("debug/cgi", JSON.stringify(call_group_info.calls_to_issue), 1, true);
        ShellyCallQ.add_calls(call_group_info.calls_to_issue);
    } catch (err) {
        print("Error in hitTRVs: ", err);
        MQTT.publish("bug/1", JSON.stringify(err), 1, true);
    }
}

//Actual task that is to be run on a schedule

function scheduledTask() {

    trvs = [
        "shellytrv-b4e3f9d9e3d7",
        // "shellytrv-842e14ffcb48",
        "192.168.1.43",
        "shellytrv-b4e3f9e30ab3",
        "shellytrv-8cf681d9a228",
        "shellytrv-8cf681b9c952",
        "shellytrv-588e81a6306d",
        "shellytrv-b4e3f9d6249d",
        // "shellytrv-8cf681cd22c2",
        "192.168.1.17",
        // "shellytrv-8cf681b9c9ae",
        "192.168.1.73",
        "shellytrv-8cf681b70b5e",
        "shellytrv-8cf681a52e2e",
        "shellytrv-8cf681c1abc8",
        "shellytrv-8cf681d9a230",
        "shellytrv-8cf681be1608"]
    //corridor, kitchen, directors, vicedirectors pv meter:pv


    // trvs = [
    //     "shellytrv-588e81a63315",
    //     "shellytrv-842e14fe1d64",
    //     "shellytrv-8cf681b70e6c",
    //     "shellytrv-588e81617272",
    //     "shellytrv-8cf681beo83a",
    //     "shellytrv-588e81616952",
    //     "shellytrv-8cf681cd1598",
    //     "shellytrv-8cf681e9a780",
    //     "shellytrv-b4e3f9d9bc83",
    //     "shellytrv-cc86ecb3e4cd",
    //     "shellytrv-8cf681a51bae",
    //     "shellytrv-8cf681b9c924",
    //     "shellytrv-842e14ffaf1c"]
    //1st floor, bathroom, toilet, classroom 4, meter:antlia


    hitTRVs(trvs);

}