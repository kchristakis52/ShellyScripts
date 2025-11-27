Shelly.call("Schedule.Create", {
    "enable": false,
    "timespec": "0 0 22 1 1 *",
    "calls": [
        {
            "method": "Switch.Set",
            "params": {
                "id": 0,
                "on": true
            }
        },
        {
            "method": "Schedule.Update",
            "params": {
                "id": 1,
                "enable": false
            }
        }
    ]
}, null
)
Shelly.call("Schedule.Create", {
    "enable": false,
    "timespec": "0 0 22 1 1 *",
    "calls": [
        {
            "method": "Switch.Set",
            "params": {
                "id": 0,
                "on": false
            }
        },
        {
            "method": "Schedule.Update",
            "params": {
                "id": 2,
                "enable": false
            }
        }
    ]
}, null
)
Shelly.call("Schedule.Create", {
    "enable": false,
    "timespec": "0 01 22 1 1 *",
    "calls": [
      {
        "method": "Switch.Set",
        "params": {
          "id": 0,
          "on": true
        }
      }
    ]
  }, null
)
Shelly.call("Schedule.Create", {
    "enable": false,
    "timespec": "0 01 22 1 1 *",
    "calls": [
      {
        "method": "Switch.Set",
        "params": {
          "id": 0,
          "on": false
        }
      }
    ]
  }, null
)