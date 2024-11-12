function parseQueryString(queryString) {
    let obj = {};
    let pairs = queryString.split('&'); // Split by '&' to get each key-value pair

    for (let i = 0; i < pairs.length; i++) {
        let pair = pairs[i].split('='); // Split each pair by '='
        let key = pair[0];
        let value = pair[1];

        // Convert the value to a number if it's numeric
        obj[key] = (i == 2) ? value : parseFloat(value);
    }

    return obj;
}

function publishToMQTT(req, res) {
    // Get the data from the request
    const data = req.query
    // console.log(JSON.stringify(parseQueryString(data)));
    let query_data = parseQueryString(data)

    let mqtt_mess = {
        Timestamp: new Date().toISOString(),
        Measurements: [{
            Value: {
                Temperature: query_data.tempC,
                Humidity: query_data.hum,
            }
        }]
    }

    MQTT.publish('inherit/hnt/' + query_data.mac, JSON.stringify(mqtt_mess), 1, true)
    res.code = 200
    res.body = 'Data published to MQTT'
    res.send()
}

HTTPServer.registerEndpoint('endpoint', publishToMQTT)