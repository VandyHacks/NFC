const express = require('express');
const port = 3000;
const app = express();

// fake qr data
let fake_qr_data = []
// this endpoint should constantly update (serve json)
app.get('/qrdata', function (req, res) {
    return res.json(fake_qr_data);
});
// server live on PORT number (eg. localhost:3000/)
app.listen(port, function () {
    console.log("Server is running on " + port + " port");
});

// generates a fake qr unique id every 5 seconds
setInterval(function () {
    let n = getRandomInt(10000000,99999999)
    fake_qr_data.push(n)
    console.log(n)
}, 5000);

// generate random int in range
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}