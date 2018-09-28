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
    // await response of fetch call
    let API_URL ='https://apply.vandyhacks.org/api/events'
    if (!location.hostname.endsWith('vandyhacks.org')) {
        // primarily to bypass CORS, see https://github.com/Freeboard/thingproxy
        API_URL = 'https://thingproxy.freeboard.io/fetch/' + API_URL
    }
    let response = await fetch(API_URL);
    // only proceed once promise is resolved
    let data = await response.json();
    // only proceed once second promise is resolved
    return data;
}