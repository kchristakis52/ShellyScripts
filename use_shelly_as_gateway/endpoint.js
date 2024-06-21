function GetPwr(request, response) {
    Shelly.call("KVS.GetMany", { match: "trv*" }, function (result, error_code, error_message) {

        if (error_code != 0) {
            // process error
        } else {
            let items = result.items
            let a = JSON.stringify(items)
            MQTT.publish("a", a)

            let htmlbody = '<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>TRV Data</title> <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet" /> </head> <body class="container my-4"> <div class="container mx-auto g-3"> <h1>TRV Data</h1> <div class="mb-3"> <label for="dropdown" class="form-label">Choose an option:</label> <select class="form-select" id="dropdown">'
            htmlbody += '<option value="">Select...</option>'

            for (let key in items) {
                if (items.hasOwnProperty(key)) {
                    console.log(key); // item1, item2
                    console.log(items[key].etag); // 0DWty8HwCB, 0DMHqWL0P0
                    console.log(items[key].value); // item1 value, item2 value
                    trvData = JSON.parse(items[key].value)
                    htmlbody += '<option value="' + key + '">' + key + '</option>'
                }
            }

            htmlbody += '</select> </div> <div class="row justify-content-center align-items-center"> <div class="col-md-4"> <div class="card mb-4"> <div class="card-body"> <h5 class="card-title">Battery</h5> <div id="battery" class="card-text"></div> </div> </div> </div> <div class="col-md-4"> <div class="card mb-4"> <div class="card-body"> <h5 class="card-title">Target Temperature</h5> <div id="target_temperature" class="card-text"></div> </div> </div> </div> <div class="col-md-4"> <div class="card mb-4"> <div class="card-body"> <h5 class="card-title">Room Temperature</h5> <div id="ext_temperature" class="card-text"></div> </div> </div> </div> <div class="col-md-4"> <div class="card"> <div class="card-body"> <h5 class="card-title">Valve</h5> <div id="valve" class="card-text"></div> </div> </div> </div> <div class="col-md-4"> <div class="card"> <div class="card-body"> <h5 class="card-title">Set Target Temperature</h5> <form> <div class="form-group"> <label for="numberInput">Between 4 and 31 degrees</label> <input type="number" class="form-control" id="numberInput" name="numberInput" min="4" max="31" required /> </div> <button type="submit" class="btn btn-primary mt-3"> Submit </button> </form> </div> </div> </div> </div> </div> <script> const parsedObject = ' + a + '; for (const key in parsedObject) { if (parsedObject[key].hasOwnProperty("value")) { parsedObject[key].value = JSON.parse(parsedObject[key].value); } } target_temperature = document.getElementById("target_temperature"); external_temperature = document.getElementById("ext_temperature"); battery = document.getElementById("battery"); valve = document.getElementById("valve"); document .getElementById("dropdown") .addEventListener("change", function () { let selectedKey = this.value; battery.textContent = parsedObject[selectedKey].value.battery; target_temperature.textContent = parsedObject[selectedKey].value.target_t; valve.textContent = parsedObject[selectedKey].value.valve_position; external_temperature.textContent = parsedObject[selectedKey].value.temperature; }); document.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); const selectedKey = document.getElementById("dropdown").value; const numberInput = document.getElementById("numberInput").value; const hostname = parsedObject[selectedKey].value.hostname; fetch( `${window.location.origin}/rpc/HTTP.GET?url="http://${hostname}.local/settings/thermostats/0?target_t=${numberInput}"` ) .then((response) => response.json()) .then((data) => { console.log("Success:", data); alert("Form submitted successfully"); }) .catch((error) => { console.error("Error:", error); alert("An error occurred while submitting the form"); }); }); </script> <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script> </body> </html>'
            //htmlbody+='</select> </div> <div class="row justify-content-center align-items-center"> <div class="col-md-4"> <div class="card" style="width: 18rem"> <div class="card-body"> <h5 class="card-title">Battery</h5> <div id="battery" class="card-text"></div> </div> </div> </div> <div class="col-md-4"> <div class="card" style="width: 18rem"> <div class="card-body"> <h5 class="card-title">Temperature</h5> <div id="temperature" class="card-text"></div> </div> </div> </div> </div> </div> <script> const parsedObject = '+a+'; for (const key in parsedObject) { if (parsedObject[key].hasOwnProperty("value")) { parsedObject[key].value = JSON.parse(parsedObject[key].value); } } target_temperature = document.getElementById("temperature"); battery = document.getElementById("battery"); document .getElementById("dropdown") .addEventListener("change", function () { let selectedKey = this.value; battery.textContent = parsedObject[selectedKey].value.battery; target_temperature.textContent = parsedObject[selectedKey].value.target_t; }); </script> <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script> </body> </html>'
            response.body = htmlbody;
            response.code = 200;
            response.send();
        }
    });
}
HTTPServer.registerEndpoint('pwr', GetPwr)