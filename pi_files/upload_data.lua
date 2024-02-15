#!/usr/bin/lua5.4
-- Required libraries
local cjson = require("cjson")
local luasql = require("luasql.sqlite3")
local mqtt = require("mqtt")
local gateway_uuid = 'fc04af0f-1a6a-49b9-aa81-95ef25296b44'
-- MQTT connection parameters
local broker = "192.168.1.2:1883"
local topic = "download_data"
local client_id = "gateway_uuid_uploader"

local client = mqtt.client {
  uri = broker,
  username = "user",
  password = "root",
  clean = true,
}
client:on {
  connect = function(connack)
    if connack.rc ~= 0 then
      print("Connection to broker failed:", connack:reason_string(), connack)
      return
    end
    print("Connected:", connack)

    -- SQLite database connection
    local env = assert(luasql.sqlite3())
    local con = assert(env:connect("/home/kostas/diplwmatiki/sensor_data.db"))

    -- Query the database
    local cursor = assert(con:execute("SELECT * FROM sensor_data"))
    local row = cursor:fetch({}, "a")
    while row do
      row.gateway_uuid = gateway_uuid
      -- Publish message to MQTT topic
      local message = cjson.encode(row)
      print("Publishing:", message)
      assert(client:publish {
        topic = topic,
        payload = cjson.encode(row),
        qos = 0
      })

      row = cursor:fetch({}, "a")
    end
    cursor:close()
    con:close()
    client:disconnect()
  end
}

mqtt.run_ioloop(client)
