from flask import Flask
from flask import Flask
import configparser
from flask import request

app = Flask(__name__)


@app.route("/change_config", methods=["GET"])
def change_config():
    subscribe_topic = request.args.get("subscribe_topic")
    config = configparser.ConfigParser()
    config.read("config.ini")

    config["MQTT"]["subscribe_topic"] = subscribe_topic

    with open("config.ini", "w") as configfile:
        config.write(configfile)

    return "Config updated successfully"


if __name__ == "__main__":
    app.run(debug=True)
