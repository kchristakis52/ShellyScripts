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
    const message = req.body.device_id
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

app.post('insert_device_data', (req, res) => {
    const device_id = req.body.device_id
    const gateway_uuid = req.body.gateway_uuid
    const type = req.body.type
    const value = req.body.value
    const timestamp = req.body.timestamp

    db.run('INSERT INTO devices (device_id, value, timestamp, type, gateway_uuid) VALUES (?, ?, ?, ?,  ?)', [device_id, value, timestamp, type, gateway_uuid], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send('Device data inserted');
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});