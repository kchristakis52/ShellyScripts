local mqtt = require("mqtt")
local cjson = require("cjson")
local luasql = require("luasql.sqlite3")

-- SQLite database connection
local env = assert(luasql.sqlite3())
local con = assert(env:connect("sensor_data.db"))

-- MQTT connection parameters
local broker = "192.168.1.2:1883"
local topic = "shellies/+/relay/0/+"
local client_id = "mqtt_lua_client"

-- Function to insert data into the sensor_data table
function insertData(device_id, value, type, --[[optional]] timestamp)
    timestamp = timestamp or os.time()
    local success, error_code = con:execute(string.format(
        "INSERT INTO sensor_data (device_id, timestamp, value, type) VALUES ('%s', %d, %f, '%s')",
        device_id,
        timestamp,
        value, type))

    if not success then
        print("Error executing SQL statement. Error code:", error_code)
    end
end

while true do
    -- Create MQTT client
    local client = mqtt.client {
        uri = broker,
        username = "user",
        password = "root",
        clean = true,
    }

    -- Callbacks
    client:on {
        connect = function(connack)
            if connack.rc ~= 0 then
                print("Connection to broker failed:", connack:reason_string(), connack)
                return
            end
            print("Connected:", connack)

            -- Subscribe to MQTT topic
            assert(client:subscribe {
                topic = topic,
                qos = 1,
                callback = function(suback)
                    print("Subscribed:", suback)
                end
            })
        end,

        message = function(msg)
            assert(client:acknowledge(msg))
            print("Received:", msg)

            -- Get device ID from message
            local function splitString(inputString, delimiter)
                local substrings = {}
                for substring in inputString:gmatch("[^" .. delimiter .. "]+") do
                    table.insert(substrings, substring)
                end
                return substrings
            end

            local topicParts = splitString(msg.topic, "/")
            local device_id = topicParts[2]
            local sensor_type = topicParts[5]

            if msg.payload:sub(1, 1) == "{" then
                -- Decode JSON payload
                local success, data = pcall(cjson.decode, msg.payload)
                if success then
                    local timestamp = data.timestamp
                    local sensorValue = tonumber(data.value)
                    insertData(device_id, sensorValue, sensor_type, timestamp)
                else
                    print("Failed to decode JSON payload:", data)
                end
            else
                print("Payload:", msg.payload)

                local sensorValue = tonumber(msg.payload)
                insertData(device_id, sensorValue, sensor_type)
            end
        end,

        error = function(err)
            print("MQTT client error:", err)
        end,
    }

    -- Run the MQTT event loop
    mqtt.run_ioloop(client)

    -- Close connections
    client:close()
end

con:close()
env:close()
