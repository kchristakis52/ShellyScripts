let device_metadata = [
    {
        device_id: "shellyproem50-08f9e0e69078",
        device_type: "Building_Electrical_Meter",
        points: [
            {
                point_name: "current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "act_power",
                point_type: "Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "pf",
                point_type: "Power_Sensor",
                point_unit: "",
            },
            {
                point_name: "frequency",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "aprt_power",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
        ],
    },
    {
        device_id: "3em-id",
        device_type: "Building_Electrical_Meter",
        points: [
            {
                point_name: "a_act_power",
                point_type: "Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "a_aprt_power",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "a_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "a_frequency",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "a_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "",
            },
            {
                point_name: "a_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "b_act_power",
                point_type: "Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "b_aprt_power",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "b_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "b_frequency",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "b_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "",
            },
            {
                point_name: "b_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "c_act_power",
                point_type: "Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "c_aprt_power",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "c_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "c_frequency",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "c_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "",
            },
            {
                point_name: "c_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "a_total_act_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "b_total_act_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "c_total_act_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "a_total_act_ret_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "b_total_act_ret_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "c_total_act_ret_energy",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },

            {
                point_name: "total_act",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "total_act_ret",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "total_act_power",
                point_type: "Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "total_aprt_power",
                point_type: "Power_Sensor",
                point_unit: "VA",
            },
            {
                point_name: "total_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
        ],
    },

    {
        device_id: "shellytrv-60a423db07a6",
        device_type: "TRV",
        points: [
            {
                point_name: "external_temp",
                point_type: "Temperature_Sensor",
                point_unit: "Celsius",
            },
            {
                point_name: "target_temp",
                point_type: "Temperature_Setpoint",
                point_unit: "Celsius",
            },
            {
                point_name: "valve_pos",
                point_type: "Position_Sensor",
                point_unit: "%",
            },
        ],
    },

    {
        device_id: "shellyplusht-a0a3b3dd8904",
        device_type: "H&T",
        points: [
            {
                point_name: "humidity",
                point_type: "Humidity_Sensor",
                point_unit: "%",
            },
            {
                point_name: "temperature",
                point_type: "Temperature_Sensor",
                point_unit: "Celsius",
            },
        ],
    },
];

function publishDataCallback(topic, message, userdata) {
    //print(JSON.stringify(device_metadata));
    if (message == "get") {
        MQTT.publish("buildon/fasada/gdynia/configurations", JSON.stringify(device_metadata));
    }
}

MQTT.subscribe("buildon/fasada/gdynia/get_configurations", publishDataCallback);