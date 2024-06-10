function GetPwr(request, response) {
    let userdata = ["request", "response"]
    Shelly.call("KVS.GetMany", { match: "trv*" }, function (result, error_code, error_message) {

        if (error_code != 0) {
            // process error
        } else {
            items = result.items
            let htmlbody = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>htmx Example</title><script src="https://unpkg.com/htmx.org@1.8.1/dist/htmx.min.js"></script></head><body>'
            let dropdown = '<label for="dropdown">Choose an option:</label><select id="dropdown" hx-trigger="change from:#dropdown"> <option value="">Select...</option>'
            let divs = '<div id="content">'
            for (let key in items) {
                if (items.hasOwnProperty(key)) {
                    console.log(key); // item1, item2
                    console.log(items[key].etag); // 0DWty8HwCB, 0DMHqWL0P0
                    console.log(items[key].value); // item1 value, item2 value
                    trvData = JSON.parse(items[key].value)
                    dropdown += '<option value="' + key + '">' + key + '</option>'
                    alldivs = "<div>" + trvData.valve_position + "</div> <div>" + trvData.battery + "</div>"
                    divs += '<div id="' + key + '" class="content-item">' + alldivs + '</div>'


                }
            }
            dropdown += '</select>'
            divs += '</div>'
            htmlbody += dropdown + divs
            htmlbody += "<style>.content-item {display: none;}</style><script>document.getElementById('dropdown').addEventListener('change', function() {var selectedValue = this.value;var contentItems = document.querySelectorAll('.content-item');contentItems.forEach(function(item) {item.style.display = 'none';});if (selectedValue) {var selectedContent = document.getElementById(selectedValue);if (selectedContent) {selectedContent.style.display = 'block';}}});</script></body></html>"
            response.body = htmlbody
            response.code = 200;
            response.send();
        }
    });

}

HTTPServer.registerEndpoint('pwr', GetPwr)
// visit to http://<ip of device>/script/<id of script>/pwr
// More about https://shelly-api-docs.shelly.cloud/gen2/0.14/Scripts/ShellyScriptLanguageFeatures#httpserverregisterendpoint