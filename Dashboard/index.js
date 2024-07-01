const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const wss = new WebSocket.WebSocketServer({ port: 8080 });
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
let inflight_http_requests = {}
wss.on('connection', function connection(ws, http_request) {
    request_uuid = http_request.url.split('/')[1]
    ws.on('error', console.error);
    // When the gateway sends a message, send it to the client
    ws.on('message', function message(data) {
        if (inflight_http_requests.hasOwnProperty(request_uuid)) {
            inflight_http_requests[request_uuid].res.send(data)
            delete inflight_http_requests[request_uuid]
        }
    });
    // If request_uuid is valid, send the message to the gateway
    if (inflight_http_requests.hasOwnProperty(request_uuid)) {
        ws.send(inflight_http_requests[request_uuid].message)
    }
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
    const topic = req.body.gateway_uuid
    const message = req.body.url
    if (message == 'sendData') {
        client.publish(topic, message);
        res.send('Request sent');
    }
    else {
        const request_uuid = uuidv4()
        res.setTimeout(5000, () => {
            res.status(500).send('Timeout Error');
            delete inflight_http_requests[request_uuid]
        });
        inflight_http_requests[request_uuid] = {
            message: message,
            res: res
        }
        client.publish(topic, request_uuid);
    }
});

app.get('/device_controls', (req, res) => {
    const deviceType = req.query.device_type
    res.render(`${deviceType}_controls`, { gateway_uuid: req.query.gateway_uuid, device_id: req.query.device_id });
});

app.get('/device_data', (req, res) => {
    const gatewayId = req.query.gateway_uuid
    const deviceId = req.query.device_id
    const deviceType = req.query.device_type
    // Fetch data from the database
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