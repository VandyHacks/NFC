const dataList = document.getElementById('json-datalist');
const input = document.getElementById('eventcode');
let events;

getEvents()
    .then((data) => {
        // JSON.parse?
        console.log(data)
        input.onkeyup = function () {
            // nfc emulates keyboard...
        };
    });

async function getEvents () {
    let headers = new Headers({
        "Accept"       : "application/json",
        "Content-Type" : "application/json",
        "User-Agent"   : "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0",
    });

    
    // await response of fetch call
    let response = await fetch('https://apply.vandyhacks.org/api/events',{ headers: headers});
    // only proceed once promise is resolved
    let data = await response.json();
    // only proceed once second promise is resolved
    return data;
}