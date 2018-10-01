const dataList = document.getElementById('json-datalist');
const input = document.getElementById('eventcode');
let token = ''

const EVENT_URL = 'https://apply.vandyhacks.org/api/events'
let EVENT_ID = "" // eg. '5ba688091834080020e18db8'
const ADMIT_URL = `${EVENT_URL}/${EVENT_ID}/admit/${id}` // to admit user by db id
const UNADMIT_URL = `${EVENT_URL}/${EVENT_ID}/unadmit/${id}` // to unadmit user by db id
const USERS_URL = 'https://apply.vandyhacks.org/api/users/condensed' // condensed users json

// need doc.onload to wrap this
getEvents()
    .then((data) => {
        // JSON.parse?
        console.log(data)
        input.onkeyup = function () {
            // nfc emulates keyboard...
        };
    });

async function getEvents () {
    if (!location.hostname.endsWith('vandyhacks.org')) {
        // primarily to bypass CORS issues in client-side API calls, see https://github.com/Freeboard/thingproxy
        // works by proxying client-side API call through a server (could host your own proxy as well)
        EVENT_URL = 'https://thingproxy.freeboard.io/fetch/' + EVENT_URL
    }
    let response = await fetch(EVENT_URL);
    let events = await response.json();
    // filter only open events
    events = events.filter(e => e.open))
    return events;
}

/**********************************************************************
This section below is pretty much copied from QR scan logic: 
See https://github.com/VandyHacks/VHF2017-qr-checkin/blob/master/index.html#L189
**********************************************************************/
  function admitAttendee(id) {
    const header = tokenHeader();
    if (!invalid) {
        fetch(ADMIT_URL, {
            headers: header
        })
        .then(res => {
            res = { headers: 'admitted' }
        });
    }
    returnToScan();
  }

  function unadmitAttendee(id) {
    const header = tokenHeader();
    console.log('unadmit');
    if (!invalid) {
        fetch(UNADMIT_URL, {
            headers: header
        }).then(res => {
            res = { headers: unadmitted }
        });
    }
    returnToScan();
}

// set auth JWT token
 function setToken() {
    console.log(token);
    console.log("pls");
    fetch('https://apply.vandyhacks.org/auth/eventcode/', {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ token: token })
    }).then(res => {
        if (res.ok) {
            // scan();
            tokenValid = true;
            window.localStorage.storedToken2 = token;
        } else {
            console.log('invalid');
            authError = 'Invalid token';
        }
    });
  }
