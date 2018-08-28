const express = require('express');
const port = 3000;
const app = express();

let fake_qr_data = []
app.get('/', function (req, res) {
    return res.json(fake_qr_data);
});
app.listen(port, function () {
    console.log("Server is running on " + port + " port");
});

setInterval(function () {
    fake_qr_data.push(getRandomInt(10000000,99999999))
}, 5000);

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}