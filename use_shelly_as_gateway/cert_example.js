//use awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}'  ca.pem
let certca = "";
let client_cert = "";
let client_key = "";
function printresult(result) {
    console.log(result);
};
Shelly.call("Shelly.PutUserCA", { data: certca }, printresult);
Shelly.call("Shelly.PutTLSClientCert", { data: client_cert }, printresult);
Shelly.call("Shelly.PutTLSClientKey", { data: client_key }, printresult);