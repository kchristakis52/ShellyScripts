Shelly.call(
    "schedule.create",
    {
        "enable": true,
        "timespec": "0 * * * * *",
        "calls": [{
            "method": "Switch.Set",
            "params": {
                "id": 0,
                "on": true
            }
        }
        ]
    },
    function () {

    }
);