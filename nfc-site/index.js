const dataList = document.getElementById("json-datalist");
const input = document.getElementById("eventcode");
let token = "";
let id = "";
let tokenValid = false;

const API_URL = "https://apply.vandyhacks.org/api";
let EVENT_ID = ""; // eg. '5ba688091834080020e18db8';

const USERS_URL = `${API_URL}/users/condensed`; // condensed users json

// TODO: need doc.onload to wrap this
getEvents().then(data => {
  // JSON.parse?
  console.log(data);
  input.onkeyup = function() {
    // nfc emulates keyboard...
  };
});

// TODO: on auth code popup submit, set the token and call setToken()

async function getEvents() {
  let EVENT_URL = `${API_URL}/events/`;
  if (!location.hostname.endsWith("vandyhacks.org")) {
    // primarily to bypass CORS issues in client-side API calls, see https://github.com/Freeboard/thingproxy
    // works by proxying client-side API call through a server (could host your own proxy as well)
    EVENT_URL = "https://thingproxy.freeboard.io/fetch/" + EVENT_URL;
  }
  let response = await fetch(EVENT_URL);
  let events = await response.json();
  // filter only open events
  events = events.filter(e => e.open);
  return events;
}

/**********************************************************************
This section below is pretty much copied from QR scan logic: 
See https://github.com/VandyHacks/VHF2017-qr-checkin/blob/master/index.html#L189
**********************************************************************/
function admitAttendee(id) {
  const ADMIT_URL = `${EVENT_URL}/admit/${id}`; // to admit user by db id
  const header = tokenHeader();
  fetch(ADMIT_URL, {
    headers: header
  }).then(res => {
    res = { headers: "admitted" };
  });
  // returnToScan();
}

function unadmitAttendee(id) {
  const UNADMIT_URL = `${EVENT_URL}/unadmit/${id}`; // to unadmit user by db id
  const header = tokenHeader();
  console.log("unadmit");
  fetch(UNADMIT_URL, {
    headers: header
  }).then(res => {
    res = { headers: unadmitted };
  });
  // returnToScan();
}

// set auth JWT token
function setToken() {
  console.log(token);
  console.log("pls");
  fetch("https://apply.vandyhacks.org/auth/eventcode/", {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ token: token })
  }).then(res => {
    if (res.ok) {
      // scan();
      tokenValid = true;
      window.localStorage.storedToken2 = token;
    } else {
      console.log("invalid");
      authError = "Invalid token";
    }
  });
}
