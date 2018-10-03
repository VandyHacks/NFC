const dataList = document.getElementById("json-datalist");
const input = document.getElementById("eventcode");
let token = "";
let id = "";
let tokenValid = false;

let users;

const API_URL = "https://apply.vandyhacks.org/api";
let EVENT_ID = ""; // eg. '5ba688091834080020e18db8';
let EVENT_URL = `${API_URL}/events/`;

const USERS_URL = `${API_URL}/users/condensed`; // condensed users json
const MOCK_USERS_URL = "https://api.myjson.com/bins/nn3dk"

window.onload = e => {
  // 1. get list of all events (TODO: needs to happen periodically via setInterval)
  getEvents().then(events => {
    console.log(events);
    $.each(events, function() {
      $("#event-selector").append($("<option />").val(this._id).text(this.name));
    });
  });

  // TODO(tim): real fetch users
  // // 2. GET all users from USERS_URL (must have proper token)
  // fetch(transformURL(USERS_URL), {
  //   header: tokenHeader()
  // })
  //   .then(data => {
  //     this.users = data;
  //     console.log(this.users);
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });

  // Mock fetch users
  fetch(transformURL(MOCK_USERS_URL)).then(data => {
    return data.json();
  }).then(json => {
    users = json;
    console.log(users);
  });
};

// Displays user of corresponding shortcode
$("#shortcode").keyup(() => {
  let match = users.filter(user => user.shortcode == $("#shortcode").val())
  $("#student-info").html(JSON.stringify(match, null, 2).replace(/^\[|]$/g,""))
});

// On auth code popup submit, set the token and call setToken()
$("#auth-button").click(() => {
  token = $("#authcode").val()
  setToken()
});

// TODO(tim): actually submit nfc-user pairs

// TODO(tim): implement undo button

async function getEvents() {
  let response = await fetch(transformURL(EVENT_URL));
  let events = await response.json();
  // filter only open events
  events = events.filter(e => e.open);
  return events;
}

let transformURL = url => {
  // if dev
  if (!location.hostname.endsWith("vandyhacks.org")) {
    // primarily to bypass CORS issues in client-side API calls, see https://github.com/Freeboard/thingproxy
    // works by proxying client-side API call through a server (could host your own proxy as well)
    return "https://thingproxy.freeboard.io/fetch/" + url;
  }
  // if prod
  return url;
};

/**********************************************************************
This section below is pretty much copied from QR scan logic:
See https://github.com/VandyHacks/VHF2017-qr-checkin/blob/master/index.html#L189
**********************************************************************/
function admitAttendee(id) {
  const ADMIT_URL = `${EVENT_URL}/admit/${id}`; // to admit user by db id
  fetch(ADMIT_URL, {
    headers: tokenHeader()
  }).then(res => {
    res = { headers: "admitted" };
  });
  // returnToScan();
}

function unadmitAttendee(id) {
  const UNADMIT_URL = `${EVENT_URL}/unadmit/${id}`; // to unadmit user by db id
  console.log("unadmit");
  fetch(UNADMIT_URL, {
    headers: tokenHeader()
  }).then(res => {
    res = { headers: "unadmitted" };
  });
  // returnToScan();
}

// constructs a HTTP header with JWT token to authorize GET requests
function tokenHeader() {
  return new Headers({
    method: "GET",
    "x-event-secret": token
  });
}

// set auth JWT token
function setToken() {
  console.log(token);
  console.log("pls");
  fetch(transformURL("https://apply.vandyhacks.org/auth/eventcode/"), {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ token: token })
  }).then(res => {
    if (res.ok) {
      // scan();
      tokenValid = true;
      window.localStorage.storedToken2 = token;
      $("#auth").remove()
    } else {
      console.log("invalid");
      authError = "Invalid token";
    }
  });
}
