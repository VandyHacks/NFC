/*
constantly polls a URL
writes to JSON file
NOTE: a better solution to repeated polling is via WebHooks, but polling works fine

UPDATE 9/1/18: Unused, use python-nfc/ioWorker.py instead
*/

/*

const fetch = require('node-fetch') // for http requests?
const http = require('http') // native nodejs http requests
const fs = require('fs') // for file writes


setInterval(function () {
    // http options
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/qrdata',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }
    // get request
    http.request(options, function (err, res) {
        // Do stuff with response
        res.on("data", function (data) {
            console.log(data);
            // after getting data, process by writing to file
            let ids_array = JSON.parse(data)
            writeToFile(ids_array)
        });
    })
}, 500)

const FILENAME = 'qr-nfc-pairs.json'
function writeToFile(ids_array){
    // write to JSON file
    fs.readFile(FILENAME, 'utf8', function readFileCallback(err, data){
        if (err){
            console.error(err);
            return;
        }
        // 1. read data from file
        let pairs = JSON.parse(data).pairs;

        // 2. add some data
        ids_array.foreach(id => {
            let pairExists = pairs.find(function(pair) {
                return pair.qr===id && pair.nfc
            });
            if(pairExists)
                throw Error("This NFC ID has already been assigned to an existing person.")
            pairs.push({qr: id, nfc: ''})
        })
        
        // 3. convert it back to json & write to file
        let output = JSON.stringify({pairs: pairs});
        fs.writeFile(FILENAME, output, 'utf8', function(err){
            if(err){
                console.error(err)
            }
            else{
                console.log("File updated successfully.")
            }
        });
    });
}
*/