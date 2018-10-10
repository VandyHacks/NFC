const dataList = document.getElementById("json-datalist");
const input = document.getElementById("eventcode");
let token = "";;
let tokenValid = false;

let id;
let users;

const API_URL = "https://apply.vandyhacks.org/api";
let EVENT_ID = ""; // eg. '5ba688091834080020e18db8';
let EVENT_URL = `${API_URL}/events/`;

const USERS_URL = `${API_URL}/users/condensed`; // condensed users json

window.onload = e => {
  $("#maindiv").hide();

  // 1. get list of all events (TODO: needs to happen periodically via setInterval)
  setInterval(() => {
    getEvents().then(events => {
      console.log(events);
      $("#event-selector").html("<option selected>Choose Event...</option>")
      $.each(events, function() {
        $("#event-selector").append($("<option />").val(this._id).text(this.name));
      });
    })}, 10000)
};

// Displays user of corresponding shortcode
// TODO(tim): block input until users are loaded
$("#shortcode").keyup(() => {
  if (users) {
    let shortcode = $("#shortcode").val()
    let match = users.filter(user => user.code == shortcode)
    if (match.length == 1) {
      $("#student-info").html(JSON.stringify(match[0], null, 2))
      id = match[0].id
      console.log(id)
    } else if (match.length > 1) {
      console.log("Somehow found two users with same shortcode: ", shortcode)
    }
  }
});

// On auth code popup submit, set the token and call setToken()
$("#authcode").keyup((e) => {
  if (e.keyCode == 13) {
    token = $("#authcode").val()
    setToken()
  }
});
$("#auth-button").click(() => {
  token = $("#authcode").val()
  setToken()
});

// TODO(tim): actually submit nfc-user pairs
$("#nfc").keyup((e) => {
  if (e.keyCode == 13) {
    console.log("trying to set pair")
    setPair($("#nfc").val())
  }
});

// const PAIR_URL = `${API_URL}/users/:id/${id}`
// const PAIR_URL = `${API_URL}/users/${id}/NFC`

function setPair(nfc) {
  console.log(id)
  console.log(nfc)
  console.log(token)
  fetch(transformURL(`${API_URL}/users/${id}/NFC`), {
    method: "PUT",
    headers: new Headers({"x-event-secret": token, "Content-Type": "application/json"}),
    body: JSON.stringify({code: nfc})
  }).then(res => res.json())
  .then(json => console.log(JSON.stringify(json)))
  .catch(err => {console.log(err)})
}

// TODO(tim): implement undo button

// TODO (related to undo): have a list of past 5 or so accepted users, can undo any one of them?


async function getEvents() {
  let response = await fetch(transformURL(EVENT_URL));
  let events = await response.json();
  // filter only open events
  events = events.filter(e => e.open);
  return events;
}

let transformURL = url => {
  // if dev
  if (!location.hostname.endsWith("apply.vandyhacks.org")) {
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
  })
  .then(res => {
    if (res.ok) {
      // scan();
      tokenValid = true;
      window.localStorage.storedToken2 = token;
      $("#auth").remove()
      $("#maindiv").show();
    } else {
      console.log("invalid");
      authError = "Invalid token";
      alert(authError)
    }
  })
  .then(fetchUserData)
  .catch(err => console.log(err))
}

function fetchUserData(){
  // 2. GET all users from USERS_URL (must have proper token)
  fetch(transformURL(USERS_URL), {
    headers: tokenHeader()
    }).then(data => {
      return data.json();
    }).then(json => {
      users = json.users;
      console.log(users);
    }).catch(err => {
      console.log(err);
    });
}
