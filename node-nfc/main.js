const express = require('express');
const port = 3000;
const app = express();
app.get('/url', function() {

});
app.listen(port, function () {
    console.log("Server is running on " + port + " port");
});