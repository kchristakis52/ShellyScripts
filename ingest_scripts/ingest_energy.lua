local mqtt = require("mqtt")
local cjson = require("cjson")
local luasql = require("luasql.sqlite3")

-- SQLite database connection
local env = assert(luasql.sqlite3())
local con = assert(env:connect("shelly_data.db"))

-- MQTT connection parameters
local broker = "192.168.1.6:1883"
local topic = "shellies/shellyplusplugs-3ce90e2fbe5c/relay/0/energy"
local client_id = "mqtt_lua_client"

-- Function to insert data into the sensor_data table
function insertData(timestamp, value)
    con:execute(string.format("INSERT INTO energy_data (timestamp, value) VALUES (%d, %f)", timestamp, value))
end

while true do
    -- Create MQTT client
    local client = mqtt.client{
        uri = broker,
        username = "user",
        password = "root",
        clean = true,
    }

    -- Callbacks
    client:on{
        connect = function(connack)
            if connack.rc ~= 0 then
                print("Connection to broker failed:", connack:reason_string(), connack)
                return
            end
            print("Connected:", connack)

            -- Subscribe to MQTT topic
            assert(client:subscribe{
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

            -- Decode JSON payload
            local success, data = pcall(cjson.decode, msg.payload)
            if success then
                local timestamp = data.timestamp or os.time()
                local sensorValue = tonumber(data.aenergy_total) or 0

                -- Insert data into the database
                insertData(timestamp, sensorValue)
            else
                print("Failed to decode JSON payload:", data)
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
