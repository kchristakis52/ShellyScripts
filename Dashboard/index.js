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

const mqtt_server_url = 'mqtt://192.168.1.2'
const client = mqtt.connect(mqtt_server_url);
client.on('connect', () => {
    console.log('Connected to MQTT');
    client.subscribe('download_data');
});

client.on('message', (topic, message) => {
    // console.log('Received message:', message.toString());
    if (topic == 'download_data') {
        const data = JSON.parse(message.toString());
        db.run('INSERT INTO sensor_data (device_id, value, timestamp, type, gateway_uuid) VALUES (?, ?, ?, ?, ?)', [data.device_id, data.value, data.timestamp, data.type, data.gateway_uuid], (err) => {
            if (err) {
                // console.error(err);
            } else {
                console.log('Data inserted');
            }
        });
    }
});

// Define the endpoint for the landing page
app.get('/', (req, res) => {
    // Fetch data from the database
    db.all('SELECT * FROM gateways', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            // Render the landing page with the fetched data
            res.render('landing_page', { data: rows });
        }
    });
});

app.get('/devices', (req, res) => {
    const gatewayId = req.query.gateway
    // Fetch data from the database
    db.all("SELECT devices.*, json_group_array(json_object('action_name', actions.action_name, 'action_type', actions.action_type, 'action_endpoint', actions.action_endpoint)) as actions from devices inner join actions on devices.device_type=actions.device_type where gateway_uuid = ? group by device_id", [gatewayId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            // Render the landing page with the fetched data
            rows.forEach(row => {
                row.actions = JSON.parse(row.actions)
            })
            res.render('devices', { devices: rows });
        }
    });
});

app.post('/mqtt_to_http', (req, res) => {
    const topic = `${req.body.gateway_uuid}/${uuidv4()}`
    const message = req.body.url
    const route_client = mqtt.connect(mqtt_server_url);
    const timeout = 5000; // 5 seconds

    // Set the timeout for the response
    res.setTimeout(timeout, () => {
        res.status(500).send('Timeout Error');
        route_client.end();
    });

    route_client.on('message', (response_topic, message) => {
        // console.log('Received message:', message.toString());
        if (`${topic}/res` == response_topic) {
            res.send(message.toString());
            route_client.end();
        }
    });
    route_client.subscribe(`${topic}/res`);
    route_client.publish(topic, message);
});

app.get('/device_controls', (req, res) => {
    const deviceType = req.query.device_type
    res.render(`${deviceType}_controls`, { gateway_uuid: req.query.gateway_uuid, device_id: req.query.device_id });
});

app.get('/device_data', (req, res) => {
    const gatewayId = req.query.gateway_uuid
    const deviceId = req.query.device_id

    // Fetch data from the database
    db.all("SELECT type, json_group_array(json_object('value', sensor_data.value, 'timestamp',sensor_data.timestamp)) as data FROM sensor_data WHERE gateway_uuid = ? AND device_id = ? GROUP BY type ", [gatewayId, deviceId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            rows.forEach(row => {
                row.data = JSON.parse(row.data)
            })
            res.render('device_data', {
                data_array: rows
            });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});