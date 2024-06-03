function processMessage(topic, message, userdata) {
    messageObject = JSON.parse(message)
    Shelly.call(
        "http.get",
        { "url": "http://" + messageObject.id + messageObject.endpoint + messageObject.value },
        function (data, error_code, error_message) {
            if (error_code) {

                print(error_message)
                return;
            }
            print(data)

        }
    );
}
//Allagh se kati opws device_id h mqtt topic prefix?
MQTT.subscribe("gateway_id", processMessage)

//MQTT message must be in this form "{\"id\":\"shellytrv-60a423db07a6\",\"endpoint\":\"/thermostats/0?pos=\",\"value\":\"34\",}"
//ie. a json object stringified as defined here https://shelly-api-docs.shelly.cloud/gen2/Scripts/ShellyScriptLanguageFeatures#strings-in-json