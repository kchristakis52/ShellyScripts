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
                point_name: "Pf",
                point_type: "Power_Sensor",
                point_unit: "null",
            },
            {
                point_name: "frequency",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "aprt_power",
                point_type: "Power_Sensor",
                point_unit: "Volt-Ampere",
            },
        ],
    },
    //isws allagh se auta pou leei to excel kai oxi se auta pou leei to mail?
    {
        device_id: "3em-id",
        device_type: "Building_Electrical_Meter",
        points: [
            {
                point_name: "a_act_power",
                point_type: "Active_Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "a_aprt_power",
                point_type: "Reactive_Power_Sensor",
                point_unit: "Volt-Ampere",
            },
            {
                point_name: "a_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "a_freq",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "a_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "null",
            },
            {
                point_name: "a_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "b_act_power",
                point_type: "Reactive_Power_Sensor",
                point_unit: "Volt-Ampere",
            },
            {
                point_name: "b_aprt_power",
                point_type: "Active_Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "b_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "b_freq",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "b_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "null",
            },
            {
                point_name: "b_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "c_act_power",
                point_type: "Reactive_Power_Sensor",
                point_unit: "Volt-Ampere",
            },
            {
                point_name: "c_aprt_power",
                point_type: "Active_Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "c_current",
                point_type: "Current_Sensor",
                point_unit: "Ampere",
            },
            {
                point_name: "c_freq",
                point_type: "Frequency_Setpoint",
                point_unit: "Hertz",
            },
            {
                point_name: "c_pf",
                point_type: "Power_Factor_Sensor",
                point_unit: "null",
            },
            {
                point_name: "c_voltage",
                point_type: "Voltage_Sensor",
                point_unit: "Volt",
            },
            {
                point_name: "total_act_power",
                point_type: "Active_Power_Sensor",
                point_unit: "Watt",
            },
            {
                point_name: "total_aprt_power",
                point_type: "Reactive_Power_Sensor",
                point_unit: "Volt-Ampere",
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
                point_unit: "null",
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
                point_unit: "null",
            },
            {
                point_name: "temperature",
                point_type: "Temperature_Sensor",
                point_unit: "Celsius",
            },
        ],
    },
];

function publishDataCallback() {
    //print(JSON.stringify(device_metadata));
    MQTT.publish("get_devices_info/res" + trvHostname, JSON.stringify(device_metadata));
}

MQTT.subscribe("get_devices_info", publishDataCallback);