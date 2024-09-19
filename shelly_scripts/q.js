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
    let trvHostname = userdata.trvHostname;
    let key = userdata.key;
    if (error_code != 0) {
        print(error_message)
        MQTT.publish("debug/" + trvHostname + "/error", JSON.stringify(error_message), 1, true)
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
    let call_to_issue = [];
    call_to_issue.push(ShellyCallQ.build_call(
        "KVS.Set",
        { key: key, value: JSON.stringify(responseJSON) }

    ));

    ShellyCallQ.add_calls(call_to_issue);


};

function processKVSData(result, error_code, error_message) {
    if (error_code != 0) {
        // process error
        MQTT.publish("debug", error_message, 1, true)
    } else {

        MQTT.publish("debug", JSON.stringify(result.items), 1, true)
        let items = result.items
        let call_group_info = {
            calls_to_issue: [],
            unfinished_calls: 0,
            call_results: {},
        };

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
                call_group_info.calls_to_issue.push(ShellyCallQ.build_call(
                    "HTTP.GET",
                    { url: url },
                    processHTTPData,
                    userdata
                ));
            }
        }
        MQTT.publish("debug/cgi", JSON.stringify(call_group_info.calls_to_issue), 1, true);
        ShellyCallQ.add_calls(call_group_info.calls_to_issue);
    }

};
//Actual task that is to be run on a schedule

function scheduledTask() {
    Shelly.call("KVS.GetMany", { match: "trv/*/*" }, processKVSData);
}