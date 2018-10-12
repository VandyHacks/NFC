const dataList = document.getElementById("json-datalist");
const input = document.getElementById("eventcode");
let token = "";;
let tokenValid = false;

let id;
let users;
let events;

const API_URL = "https://apply.vandyhacks.org/api";
let EVENT_ID = ""; // eg. '5ba688091834080020e18db8';
let EVENT_NAME = ""
let EVENT_URL = `${API_URL}/events`;

const USERS_URL = `${API_URL}/users/condensed`; // condensed users json
const CHECK_IN_NAME = "test-check-in";
const NFC_CODE_LENGTH = 4; // TODO: make this the actual nfc code length

/**************************************************************************************************/
/******************** Functions to get users and events *******************************************/
$("#maindiv").hide();
window.onload = e => {
  setInterval(() => {
    getEvents().catch(err => {
      console.log(err)
    })
  }, 30000)

  // for inital load:
  getEvents().catch(err => {
    console.log(err)
  })
};

async function getEvents() {
  const response = await fetch(transformURL(EVENT_URL));
  let json = await response.json();
  // filter only open events
  json = json.filter(e => e.open).map(event => {
    delete event.attendees
    return event
  })
  if (JSON.stringify(events) === JSON.stringify(json)) {
    return;
  }
  console.log("old events: ", events)
  console.log("new events: ", json)
  events = json
  $("#event-selector").html("<option selected>Choose Event...</option>")
  $.each(events, function () {
    $("#event-selector").append($("<option />").val(this._id).text(this.name));
  });

  setInputDisable(true);
  EVENT_ID = ""
  EVENT_NAME = ""
}

function fetchUserData() {
  fetch(transformURL(USERS_URL), {
      headers: tokenHeader()
    })
    .then(data => data.json())
    .then(json => {
      users = json.users;
      if (EVENT_ID) {
        setInputDisable(false)
      }

      if (EVENT_NAME === CHECK_IN_NAME) {
        $("#name").focus()
      } else {
        $("#nfc").focus()
      }
      console.log(users)
    }).catch(err => {
      console.log(err);
    });
}

/**************************************************************************************************/
/***************************************** Handle interactions ************************************/
$("#event-selector").change(() => {
  if ($("#event-selector").prop('selectedIndex') === 0) {
    setInputDisable(true)
    EVENT_ID = ""
    EVENT_NAME = ""
    return
  }

  // have to subtract 1 to account for default choice (Choose event...)
  EVENT_ID = events[$("#event-selector").prop('selectedIndex') - 1]._id
  EVENT_NAME = events[$("#event-selector").prop('selectedIndex') - 1].name
  console.log("selected event id: ", EVENT_ID)
  console.log("selected event name: ", EVENT_NAME)

  if (users) {
    setInputDisable(false)
  }

  if (EVENT_NAME === CHECK_IN_NAME) {
    $("#name").focus()
  } else {
    $("#nfc").focus()
  }
});

// Displays user of corresponding fuzz match
$("#name").keyup((e) => {
  let criteria = user => {
    const input = $("#name").val().toLowerCase()
    for (let word of input.split(' ')) {
      if (!word || word.length === 0)
        continue
      // if any word doesn't match, return false

      if (!user.name.toLowerCase().includes(word) &&
        !user.email.toLowerCase().includes(word) &&
        !user.school.toLowerCase().includes(word))
        return false;
    }
    return true; // is match
  }
  let matches = users.filter(criteria).slice(0, 5) // 4 max
  $("#student-info").html(JSON.stringify(matches, null, '\t'))

  if (matches.length !== 1) {
    return;
  }
    console.log(matches)
    id = matches[0].id

    if (e.keyCode !== 13) {
      return;
    }
      if (EVENT_NAME !== CHECK_IN_NAME) {
        if ($("#unadmit-checkbox").prop("checked")) {
          unadmitAttendee(id, false);
        } else {
          admitAttendee(id, false);
        }
      } else {
        $("#nfc").focus()
      }
});

// On nfc code submission
$("#nfc").keyup((e) => {
  if (e.keyCode !== 13) {
    return;
  }
  let nfcCode = $("#nfc").val()
  if (nfcCode.length !== NFC_CODE_LENGTH) {
    return;
  }
  if (EVENT_NAME === CHECK_IN_NAME) {
    // during check-in, pair + admit into "check-in" event
    return setPair(nfcCode)
      .then(()=> {
        clearInputs();
        $("#name").focus()
        console.log("Paired successfully.")
        admitAttendee(nfcCode, true)
      })
      .catch(err => console.log(err));
  }
  // else if not check-in event:
  if ($("#unadmit-checkbox").prop("checked")) {
    unadmitAttendee(nfcCode, true);
  } else {
    admitAttendee(nfcCode, true);
  }
});

function setPair(nfc) {
  console.log(id)
  console.log(nfc)
  console.log(token)
  const PAIR_URL = `${API_URL}/users/${id}/NFC`
  return fetch(transformURL(PAIR_URL), {
      method: "PUT",
      headers: new Headers({
        "x-event-secret": token,
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        code: nfc
      })
    }).then(res => res.json())
    .then(json => console.log(JSON.stringify(json)))
    .catch(err => {
      console.log(err)
    })
}

/**********************************************************************
This section below is pretty much copied from QR scan logic:
See https://github.com/VandyHacks/VHF2017-qr-checkin/blob/master/index.html#L189
**********************************************************************/

// isNFC = true if id is NFC, else false (default)
function admitAttendee(id, isNFC) {
  let ADMIT_URL = `${EVENT_URL}/${EVENT_ID}/admit/${id}`; // to admit user by db id
  if (isNFC) {
    ADMIT_URL += '?type=nfc';
  }
  fetch(transformURL(ADMIT_URL), {
    headers: tokenHeader()
  }).then(res => {
    clearInputs();
    console.log("admitted")
    console.log(res)
  });
}

// isNFC = true if id is NFC, else false (default)
function unadmitAttendee(id, isNFC) {
  let UNADMIT_URL = `${EVENT_URL}/${EVENT_ID}/unadmit/${id}`; // to unadmit user by db id
  if (isNFC) {
    UNADMIT_URL += '?type=nfc';
  }
  fetch(transformURL(UNADMIT_URL), {
    headers: tokenHeader()
  }).then(res => {
    clearInputs();
    console.log("unadmitted")
    console.log(res)
  });
}

/**************************************************************************************************/
/*********************************** Authorization stuff ******************************************/

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
      headers: new Headers({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        token: token
      })
    })
    .then(res => {
      if (res.ok) {
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

// On auth code popup submit, set the token and call setToken()
$("#authcode").keyup((e) => {
  if (e.keyCode === 13) {
    token = $("#authcode").val()
    setToken()
  }
});
$("#auth-button").click(() => {
  token = $("#authcode").val()
  setToken()
});

/**************************************************************************************************/
/****************************************** Utils *************************************************/
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

// clears input fields
function clearInputs() {
  $("#name").val("")
  $("#nfc").val("")
}

// toggles disabling input
function setInputDisable(disable) {
  $("#name").prop("disabled", disable)
  $("#nfc").prop("disabled", disable)
}