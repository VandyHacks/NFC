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
    let API_URL ='https://apply.vandyhacks.org/api/events'
    if (!location.hostname.endsWith('vandyhacks.org')) {
        // primarily to bypass CORS issues in client-side API calls, see https://github.com/Freeboard/thingproxy
        // works by proxying client-side API call through a server (could host your own proxy as well)
        API_URL = 'https://thingproxy.freeboard.io/fetch/' + API_URL
    }
    let response = await fetch(API_URL);
    let data = await response.json();
    return data;
}