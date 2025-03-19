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
    // MQTT.publish("debug/" + trvHostname + "/nai", "JSON.stringify(error_message)", 1, true)

    if (error_code != 0) {
        print(error_message)
        MQTT.publish("buildon-control/fasada/" + trvHostname + "/error", JSON.stringify(error_message), 1, true)
    }
    MQTT.publish("buildon-control/fasada/" + trvHostname + "/response", JSON.stringify(data), 1, true)
}

function processKVSData(result, error_code, error_message, userdata) {
    if (error_code != 0) {
        // process error
        MQTT.publish("debug", error_message, 1, true)
    } else {

        let temperatureValue = userdata.value;
        let items = result.items
        let call_group_info = {
            calls_to_issue: [],

        };

        for (let key in items) {
            if (items.hasOwnProperty(key)) {

                MQTT.publish("debug/key", key, 1, true)
                MQTT.publish("debug/value", items[key].value, 1, true)
                let trvData = JSON.parse(items[key].value);
                let trvHostname = trvData.Measurements[0].Value.Hostname

                let url = "http://" + trvHostname + "/settings/thermostats/0?target_t=" + temperatureValue;
                MQTT.publish("debug/" + trvHostname + "/url", url, 1, true)

                call_group_info.calls_to_issue.push(ShellyCallQ.build_call(
                    "HTTP.GET",
                    { url: url }, processHTTPData, { trvHostname: trvHostname }

                ));
            }
        }

        ShellyCallQ.add_calls(call_group_info.calls_to_issue);
    }

};


// Example JSON payload:
// {"room":"Corridor","value":22}
// {"hostname":"shellytrv-588e81a41b41","value":22}

function commandCallback(topic, message) {
    let commandObject = JSON.parse(message);
    // if (commandObject.hasOwnProperty("room")) {
    //     let room = commandObject.room;
    //     let value = commandObject.value;

    //     let userdata = { "value": value };
    //     let calls_to_issue = [];
    //     if (room === "all") {
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Classroom 1/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Classroom 2/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Classroom 3/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Classroom 4/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Classroom 5/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Corridor/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Corridor 2/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Kitchen/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Bathroom/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Director's office/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Vice Director's office/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Staff toilet/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/First Floor/*" },
    //             processKVSData, userdata
    //         ));
    //     } else if (room === "Corridor") {
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Corridor/*" },
    //             processKVSData, userdata
    //         ));
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/Corridor 2/*" },
    //             processKVSData, userdata
    //         ));

    //     }
    //     else {
    //         calls_to_issue.push(ShellyCallQ.build_call(
    //             "KVS.GetMany",
    //             { match: "trv/" + room + "\/*" },
    //             processKVSData, userdata
    //         ));
    //     }

    //     ShellyCallQ.add_calls(calls_to_issue);
    // }
    // else if (commandObject.hasOwnProperty("hostname")) {
    let trvHostname = commandObject.DeviceId;
    let value = commandObject.Actions[0].ValuesMapping.Setpoint;
    let measurementId = commandObject.Actions[0].MeasurementId;
    endpointMap = {
        "TargetTemperature": "/settings/thermostats/0?target_t=",
        "ValvePosition": "/thermostats/0?pos=",
    }
    let url = "http://" + trvHostname + endpointMap[measurementId] + value;
    MQTT.publish("control_debug/" + trvHostname + "/url", url, 1, true)
    ShellyCallQ.add_calls([ShellyCallQ.build_call(
        "HTTP.GET",
        { url: url }, processHTTPData, { trvHostname: trvHostname }

    )]);
    // }

}

MQTT.subscribe("buildon-control/fasada", commandCallback)