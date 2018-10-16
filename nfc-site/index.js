let token = "";
let id;
let users;
let events;
let EVENT_ID = "";
let EVENT_NAME = "";

const API_URL = "https://apply.vandyhacks.org/api";
const EVENT_URL = `${API_URL}/events`;
const NFC_CODE_MIN_LENGTH = 5; // prevent accidental key press submission


// main initial load
$("#maindiv")[0].style.display = 'none';
window.onload = e => {
  setInterval(() => {
    getEvents().catch(err => console.error(err));
  }, 30000);

  // for inital load:
  getEvents().catch(err => console.error(err));
};

/**************************************************************************************************/
/******************** Functions to get users and events *******************************************/

async function getEvents() {
  const response = await fetch(transformURL(EVENT_URL));
  let json = await response.json();
  // filter only open events
  json = json.filter(e => e.open).map(event => {
    delete event.attendees;
    return event;
  });
  if (JSON.stringify(events) === JSON.stringify(json)) {
    return;
  }
  console.log("old events: ", events);
  console.log("new events: ", json);
  events = json;
  $("#event-selector").html("<option selected>Choose Event...</option>");
  $.each(events, function () {
    $("#event-selector").append(
      $("<option />")
      .val(this._id)
      .text(this.name)
    );

  });

  setInputDisable(true);
  EVENT_ID = "";
  EVENT_NAME = "";
}

function fetchUserData() {
  const USERS_URL = `${API_URL}/users/condensed`; // condensed users json
  fetch(transformURL(USERS_URL), {
      headers: tokenHeader()
    })
    .then(data => data.json())
    .then(json => {
      if (EVENT_ID) {
        setInputDisable(false);
      }
      users = json.users;
      console.log(`${users.length} users loaded.`);
    })
    .catch(err => console.error(err));
}

/**************************************************************************************************/
/***************************************** Handle interactions ************************************/
$("#event-selector").on('change', () => {
  const index = $("#event-selector").prop("selectedIndex");
  if (index === 0) {
    setInputDisable(true);
    EVENT_ID = "";
    EVENT_NAME = "";
    return;
  }

  // have to subtract 1 to account for default choice (Choose event...)
  EVENT_ID = events[index - 1]._id;
  EVENT_NAME = events[index - 1].name;
  console.log("selected event id: ", EVENT_ID);
  console.log("selected event name: ", EVENT_NAME);

  if (users) {
    setInputDisable(false);
  }

  // initializes focus for new event
  if (isCheckIn()) {
    $("#name")[0].focus();
  } else {
    $("#nfc")[0].focus();
  }
});

// Displays user of corresponding fuzz match
$("#name").on('keyup', e => {
  id = undefined; // reset id
  const INPUT = $("#name").val().toLowerCase();
  if (INPUT.length === 0) {
    $("#student-info").html("");
    return;
  }
  let criteria = user => {
    for (let word of INPUT.split(" ")) {
      if (!word || word.length === 0) continue;
      // if any word doesn't match, return false

      if (
        !user.name.toLowerCase().includes(word) &&
        !user.email.toLowerCase().includes(word) &&
        !user.school.toLowerCase().includes(word)
      )
        return false;
    }
    return true; // is match
  };
  const matches = users.filter(criteria).slice(0, 5); // 5 max
  const matches_condensed = matches.map(e => ({ ...e,
    id: undefined
  })); // deep-copy, remove ids from display
  $("#student-info").html(JSON.stringify(matches_condensed, null, "\t"));

  if (matches.length === 0) {
    return;
  }

  id = matches[0].id; // takes first match
  if (e.keyCode !== 13) {
    return;
  }
  console.log(matches);

  if (!isCheckIn()) {
    const admit = !($("#unadmit-checkbox").prop("checked"));
    setAdmitAttendee(id, false, admit);
  } else {
    $("#nfc")[0].focus(); // during check-in: pressing enter on name focuses to nfc
  }
});

// On nfc code submission
$("#nfc").on('keyup', e => {
  if (e.keyCode !== 13) {
    return;
  }
  const nfcCode = $("#nfc").val();
  
  if (nfcCode.length < NFC_CODE_MIN_LENGTH) {]
    console.error(`NFC code must be longer than ${NFC_CODE_MIN_LENGTH} chars.`)
    return;
  }
  if (isCheckIn()) {
    // during check-in, pair + admit into "check-in" event
    return setPair(nfcCode)
      .then(() => {
        console.log("Paired successfully.");
        clearInputs();
        $("#name")[0].focus(); // during check-in: switch focus back to name for next submission
        setAdmitAttendee(nfcCode, true, true);
      })
      .catch(err => console.error(err));
  }
  // else if not check-in event:
  const admit = !($("#unadmit-checkbox").prop("checked"));
  setAdmitAttendee(nfcCode, true, admit);
});


/**************************************************************************************************/
/*********************************** Actions w/ backend API ***************************************/

function setPair(nfc) {
  if (!id){
    return Promise.reject('Unable to pair: no user id found.');
  }
  console.log(id, nfc, token);
  const PAIR_URL = `${API_URL}/users/${id}/NFC`;
  return fetch(transformURL(PAIR_URL), {
      method: "PUT",
      headers: new Headers({
        "x-event-secret": token,
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        code: nfc
      })
    })
    .then(res => res.json())
    .then(json => console.log(json))
    .catch(err => console.error(err));
}

/**
 * 
 * @param {String} id :either user id, or nfc id
 * @param {Boolean} isNFC :true if id is NFC, else false (default)
 * @param {Boolean} admitStatus :true = admit, false = unadmit
 */
function setAdmitAttendee(id, isNFC, admitStatus) {
  const action = admitStatus ? 'admit' : 'unadmit';
  let URL = `${EVENT_URL}/${EVENT_ID}/${action}/${id}`;
  if (isNFC) {
    URL += "?type=nfc";
  }
  fetch(transformURL(URL), {
    headers: tokenHeader()
  }).then(res => {
    clearInputs();
    console.log(`ACTION: ${action}`);
    console.log(res);
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
        window.localStorage.storedToken2 = token;
        $("#auth").remove();
        $("#maindiv")[0].style.display = 'block';
      } else {
        console.log("invalid");
        alert("Invalid token");
      }
    })
    .then(fetchUserData)
    .catch(err => console.error(err));
}

// On auth code popup submit, set the token and call setToken()
$("#authcode").on('keyup', e => {
  if (e.keyCode === 13) {
    token = $("#authcode").val();
    setToken();
  }
});
$("#auth-button").on('click', () => {
  token = $("#authcode").val();
  setToken();
});

/**************************************************************************************************/
/****************************************** Utils *************************************************/
function transformURL(url) {
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
  $("#name").val("");
  $("#nfc").val("");
}

// toggles disabling input
function setInputDisable(disable) {
  $("#name").prop("disabled", disable);
  $("#nfc").prop("disabled", disable);
}

function isCheckIn() {
  return EVENT_NAME === "test-check-in";
}

/*
 * mimic jQuery DOM functionality with jQuery syntax
 * creates elements, and selects elements using $
 *
 */
/*
const $ = (str) => {
  const len = str.length;
  switch (str[0]) {
    case '<': // create dom element
      if (str[len - 1] === '>') {
        return document.createElement(str.slice(1, len - 1));
      }
      break;
    default: // select dom element
      const nodes = document.querySelectorAll(str);
      return nodes.length > 1 ? nodes : nodes[0]; // returns 1 elem, or list of elements
  }
};*/