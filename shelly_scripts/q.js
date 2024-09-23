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
