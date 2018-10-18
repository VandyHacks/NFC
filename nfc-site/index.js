let token = "";
let id;
let users;
let events;
let EVENT_ID = "";
let EVENT_NAME = "";

const API_URL = "https://apply.vandyhacks.org/api";
const EVENT_URL = `${API_URL}/events`;
const NFC_CODE_MIN_LENGTH = 5; // prevent accidental key press submission

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
    console.log("Fetched events, no need to refresh.");
    return;
  }
  console.log("Refreshed events: ", json);
  events = json;
  dom("#event-selector").innerHTML = "<option selected>Choose Event...</option>";
  events.forEach(e => {
    const newoption = dom("<option>");
    newoption.value = e._id;
    newoption.text = e.name;
    dom("#event-selector").appendChild(newoption);
  });

  setInputDisable(true);
  EVENT_ID = "";
  EVENT_NAME = "";
}

async function fetchUserData() {
  const USERS_URL = `${API_URL}/users/condensed`; // condensed users json
  try {
    const data = await fetch(transformURL(USERS_URL), {
      headers: tokenHeader()
    });
    const json = await data.json();
    if (EVENT_ID) {
      setInputDisable(false);
    }
    users = json.users;
    console.log(`${users.length} users loaded.`);
  }
  catch (err) {
    return console.error(err);
  }
}

/**************************************************************************************************/
/***************************************** Handle interactions ************************************/

dom("#search-checkbox").addEventListener("change", () => {
  // enable user to TOGGLE search bar visibility during non-checkin events
  if (isCheckIn()) {
    return;
  }
  const showSearch = dom("#search-checkbox").checked;
  dom("#name").style.display = showSearch ? "block" : "none";
  dom("#nfc").style.display = showSearch ? "none" : "block";
});

dom("#event-selector").addEventListener("change", () => {
  const index = dom("#event-selector").selectedIndex;
  if (index === 0) {
    // if no event selected
    setInputDisable(true);
    EVENT_ID = "";
    EVENT_NAME = "";
    return;
  }

  // reset inputs
  resetInputs();

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
    dom("#name").focus();
    // hide checkboxes
    dom("#checkboxes").style.display = "none";
  } else {
    dom("#nfc").focus();
    // hide search default
    dom("#name").style.display = "none";
  }
});

// Displays user of corresponding fuzz match
dom("#name").addEventListener("keyup", e => {
  colorLastUser(false);
  id = undefined; // reset id
  const INPUT = dom("#name").value.toLowerCase();
  if (INPUT.length === 0) {
    dom("#student-info").innerHTML = "";
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
  const matches_condensed = matches.map(e => ({
    ...e,
    id: undefined
  })); // deep-copy, remove ids from display
  dom("#student-info").innerHTML = JSON.stringify(matches_condensed, null, "\t");

  if (matches.length === 0) {
    return;
  }

  id = matches[0].id; // takes first match
  if (e.keyCode !== 13) {
    return;
  }
  console.log(matches);

  if (!isCheckIn()) {
    const admit = !dom("#unadmit-checkbox").checked;
    setAdmitAttendee(id, false, admit);
  } else {
    dom("#nfc").focus(); // during check-in: pressing enter on name focuses to nfc
  }
});

// On nfc code submission
dom("#nfc").addEventListener("keyup", e => {
  colorLastUser(false);
  if (e.keyCode !== 13) {
    return;
  }
  const nfcCode = dom("#nfc").value;

  if (nfcCode.length < NFC_CODE_MIN_LENGTH) {
    console.error(`NFC code must be longer than ${NFC_CODE_MIN_LENGTH} chars.`);
    return;
  }
  if (isCheckIn()) {
    // during check-in, pair + admit into "check-in" event
    return setPair(nfcCode)
      .then(() => {
        console.log("Paired successfully.");
        setAdmitAttendee(nfcCode, true, true);
        dom("#name").focus(); // during check-in: switch focus back to name for next submission
      })
      .catch(err => console.error(err));
  }
  // else if not check-in event:
  const admit = !dom("#unadmit-checkbox").checked;
  setAdmitAttendee(nfcCode, true, admit);
});

/**************************************************************************************************/
/*********************************** Actions w/ backend API ***************************************/

async function setPair(nfc) {
  if (!id) {
    return Promise.reject("Unable to pair: no user id found.");
  }
  console.log(id, nfc, token);
  const PAIR_URL = `${API_URL}/users/${id}/NFC`;
  try {
    const res = await fetch(transformURL(PAIR_URL), {
      method: "PUT",
      headers: new Headers({
        "x-event-secret": token,
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        code: nfc
      })
    });
    const json = await res.json();
    return console.log("Pair result: " + JSON.stringify(json));
  } catch (err) {
    return console.error(err);
  }
}

/**
 *
 * @param {String} id :either user id, or nfc id
 * @param {Boolean} isNFC :true if id is NFC, else false (default)
 * @param {Boolean} admitStatus :true = admit, false = unadmit
 */
async function setAdmitAttendee(id, isNFC, admitStatus) {
  const action = admitStatus ? "admit" : "unadmit";
  let URL = `${EVENT_URL}/${EVENT_ID}/${action}/${id}`;
  if (isNFC) {
    URL += "?type=nfc";
  }
  try {
    const res = await fetch(transformURL(URL), {
      headers: tokenHeader()
    });
    const json = await res.json();
    clearInputs();
    console.log(`ACTION: ${action}`);
    if (json.error) {
      dom("#student-info").innerHTML = JSON.stringify(json.error);
    }
    console.log(json);
    const match = users.filter(u => u.id === json)[0]
    if (match) {
      console.log(match)
      dom("#student-info").innerHTML = JSON.stringify(match, null, "\t");
      colorLastUser(true);
    }
  } catch (err) {
    return console.error(err);
  }
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
async function setToken() {
  console.log(token);
  try {
    const res = await fetch(
      transformURL("https://apply.vandyhacks.org/auth/eventcode/"),
      {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          token: token
        })
      }
    );
    if (res.ok) {
      const authElem = dom("#auth");
      authElem.parentNode.removeChild(authElem);
      dom("#maindiv").style.display = "block";
    } else {
      console.log("invalid token");
      alert("Invalid token");
    }
    await fetchUserData();
  } catch (err) {
    return console.error(err);
  }
}

// On auth code popup submit, set the token and call setToken()
dom("#authcode").addEventListener("keyup", e => {
  if (e.keyCode === 13) {
    token = dom("#authcode").value;
    setToken();
  }
});
dom("#auth-button").addEventListener("click", () => {
  token = dom("#authcode").value;
  setToken();
});

/**************************************************************************************************/
/****************************************** Utils *************************************************/

// sets color of student output
function colorLastUser(isLastUser) {
  dom("#student-info").style.color = isLastUser ? '#308030' : '#000000';
}

function transformURL(url) {
  const isDev = !location.hostname.endsWith("vandyhacks.org");
  // bypass CORS issues in client-side API calls during localhost/dev, see https://github.com/Freeboard/thingproxy
  return isDev ? "https://thingproxy.freeboard.io/fetch/" + url : url;
}

// clears input fields && sets visible
function resetInputs() {
  clearInputs();
  const elems = ["#name", "#nfc", "#unadmit-checkbox", "#search-checkbox"];
  dom("#checkboxes").style.display = "block";
  elems.forEach(e => {
    dom(e).style.display = "block"; // set visible
  });
}

// clears input fields
function clearInputs() {
  const elems = ["#name", "#nfc", "#unadmit-checkbox", "#search-checkbox"];
  elems.forEach(e => {
    dom(e).value = ""; // clear field
  });
}

// toggles disabling input
function setInputDisable(disable) {
  const elems = ["#name", "#nfc", "#unadmit-checkbox", "#search-checkbox"];
  elems.forEach(e => {
    dom(e).disabled = disable;
  });
}

function isCheckIn() {
  // TODO: change to actual name for prod
  return EVENT_NAME === "test-check-in";
}
