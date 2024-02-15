const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');
const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
const port = 3000;

// Create a connection to the SQLite database
const db = new sqlite3.Database('gateways.db');

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
    db.all('SELECT * FROM devices WHERE gateway_uuid = ?', [gatewayId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            // Render the landing page with the fetched data
            res.render('devices', { data: rows });
        }
    });
});

app.post('/toggle_switch', (req, res) => {

    const topic = req.body.gateway_uuid
    const message = req.body.url
    console.log(topic)
    console.log(message)
    // Send a message with MQTT
    const client = mqtt.connect('mqtt://192.168.1.2');
    client.on('connect', () => {
        client.publish(topic, message);
        client.end();
    });

    res.send('Message sent with MQTT');
});

app.get('get_device_data', (req, res) => {
    const gatewayId = req.query.gateway
    const deviceId = req.query.device
    // Fetch data from the database
    db.all('SELECT * FROM device_data WHERE gateway_uuid = ? AND device_uuid = ?', [gatewayId, deviceId], (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            // Render the landing page with the fetched data
            res.send(rows);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});