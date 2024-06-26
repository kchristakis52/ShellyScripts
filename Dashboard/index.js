const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
const port = 3000;

// Create a connection to the SQLite database
const db = new sqlite3.Database('gateways.db');

const mqtt_server_url = 'mqtt://192.168.1.7'
const client = mqtt.connect(mqtt_server_url);
client.on('connect', () => {
    console.log('Connected to MQTT');
    client.subscribe('download_data');
});

client.on('message', (topic, message) => {
    if (topic == 'download_data') {
        const data = JSON.parse(message.toString());
        db.run('INSERT INTO sensor_data (device_id, value, timestamp, type, gateway_uuid) VALUES (?, ?, ?, ?, ?)', [data.device_id, data.value, data.timestamp, data.type, data.gateway_uuid], (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data inserted');
            }
        });
    }
});

// Define the endpoint for the landing page
app.get('/', (req, res) => {
    db.all('SELECT * FROM gateways', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('landing_page', { data: rows });
        }
    });
});

app.get('/devices', (req, res) => {
    const gatewayId = req.query.gateway
    // Fetch data from the database
    db.all("SELECT * from devices where gateway_uuid = ?", [gatewayId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            // Render the landing page with the fetched data
            res.render('devices', { devices: rows });
        }
    });
});

app.post('/mqtt_to_http', (req, res) => {
    const topic = `${req.body.gateway_uuid}/${uuidv4()}`
    const message = req.body.url
    const route_client = mqtt.connect(mqtt_server_url);

    if (message != 'sendData') {
        // Set the timeout for the response
        const timeout = 5000; // 5 seconds        
        res.setTimeout(timeout, () => {
            res.status(500).send('Timeout Error');
            route_client.end();
        });
        route_client.on('message', (response_topic, message) => {
            if (`${topic}/res` == response_topic) {
                res.send(message.toString());
                route_client.end();
            }
        });
        route_client.subscribe(`${topic}/res`);
        route_client.publish(topic, message);
    }

    else {
        route_client.publish(topic, message);
        res.send('Data uploaded successfully');
        route_client.end();
    }
});

// app.post('/request_data', (req, res) => {
//     const topic = `${req.body.gateway_uuid}/${uuidv4()}`
//     const route_client = mqtt.connect(mqtt_server_url);
//     route_client.publish(topic, 'sendData');
//     res.send('Data uploaded successfully');
//     route_client.end();
// });


app.get('/device_controls', (req, res) => {
    const deviceType = req.query.device_type
    res.render(`${deviceType}_controls`, { gateway_uuid: req.query.gateway_uuid, device_id: req.query.device_id });
});

app.get('/device_data', (req, res) => {
    const gatewayId = req.query.gateway_uuid
    const deviceId = req.query.device_id
    const deviceType = req.query.device_type
    db.all("SELECT type, json_group_array(json_object('value', sensor_data.value, 'timestamp',sensor_data.timestamp)) as data FROM sensor_data WHERE gateway_uuid = ? AND device_id = ? AND timestamp >= unixepoch('now', '-1 days') AND timestamp <= unixepoch('now') GROUP BY type ", [gatewayId, deviceId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            data_object = {}
            rows.forEach(row => {
                row.data = JSON.parse(row.data)
                data_object[row.type] = row.data
            })
            res.render(`${deviceType}_data`, {
                data_object: data_object
            });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});