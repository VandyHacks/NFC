let token = "";
let id;
let users;
let events;
let EVENT = null;

const API_URL = "https://apply.vandyhacks.org/api";
const EVENT_URL = `${API_URL}/events`;
const NFC_CODE_MIN_LENGTH = 5; // prevent accidental key press submission

const COLORS = {
  GREEN: 'rgb(80, 187, 80)',
  RED: 'rgb(139, 0, 0)',
  LIGHT: 'rgb(230, 230, 230)',
  DARK: 'rgb(60, 56, 80)',
  BLACK: 'rgb(0, 0, 0)',
}

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
  const noNewEvents = () => {
    return events &&
    JSON.stringify([...events.map(e => e._id)].sort()) ===
    JSON.stringify([...json.map(e => e._id)].sort())
  }
  if (noNewEvents()) {
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

  hideInputs(true);
  EVENT = null;
}

async function fetchUserData() {
  const USERS_URL = `${API_URL}/users/condensed`; // condensed users json
  try {
    const json = await authorizedJSONFetch(USERS_URL)
    users = json.users;
    console.log(`${users.length} users loaded.`);
  }
  catch (err) {
    return console.error(err);
  }
}

/**************************************************************************************************/
/***************************************** Handle interactions ************************************/

function unadmitCheckboxChanged() {
  const unadmitMode = dom("#unadmit-checkbox").checked;
  // make user confirm they actually want to do this.
  if (unadmitMode) {
    const confirmation = confirm("Are you sure you want to UNADMIT users?");
    if (!confirmation) {
      dom("#unadmit-checkbox").checked = false;
      return;
    }
  }
  // turn entire page red as warning
  dom("#all").style.backgroundColor = unadmitMode ? COLORS.RED : COLORS.DARK;
};

function searchCheckboxChanged() {
  // enable user to TOGGLE search bar visibility during non-checkin events
  if (isCheckIn()) {
    return;
  }
  const showSearch = dom("#search-checkbox").checked;
  dom("#name").style.display = showSearch ? "block" : "none";
  dom("#nfc").style.display = showSearch ? "none" : "block";
};

dom("#event-selector").addEventListener("change", () => {
  const index = dom("#event-selector").selectedIndex;
  // clear inputs
  clearInputs();
  clearCheckBoxes();
  clearOutput();
  // if no event selected
  if (index === 0) {
    // if no event selected
    hideInputs(true);
    EVENT = null;
    return;
  }

  // show inputs
  hideInputs(false);

  // have to subtract 1 to account for default choice (Choose event...)
  EVENT = events[index - 1];
  console.log("selected event: ", JSON.stringify(EVENT));

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
    clearOutput();
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
dom("#nfc").addEventListener("keyup", async e => {
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
    try {
      await setPair(nfcCode);
      console.log("Paired successfully.");
      await setAdmitAttendee(nfcCode, true, true);
      dom("#name").focus(); // during check-in: switch focus back to name for next submission
    }
    catch (err) {
      return console.error(err);
    }
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
    if (processErrors(json))
      return Promise.reject('Failed to pair.')
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
  let URL = `${EVENT_URL}/${EVENT._id}/${action}/${id}`;
  if (isNFC) {
    URL += "?type=nfc";
  }
  try {
    const json = await authorizedJSONFetch(URL)
    console.log(json);
    clearInputs(); // clear inputs if successful submit
    console.log(`ACTION: ${action}`);
    if (processErrors(json))
      return;
    // display matched user
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
async function authorizedJSONFetch(url) {
  const res = await fetch(transformURL(url), {
    headers:new Headers({ "x-event-secret": token })
  });
  return await res.json();
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

/**************************************************************************************************/
/****************************************** Utils *************************************************/

// returns whether errors were detected in JSON message.
function processErrors(json) {
  let err_msg = json.message || json.error;
  if (!err_msg)
    return false;
  const IDRegex = /\w*\d\w*/g; // finds ids (usually alphanumeric)
  err_msg = JSON.stringify(err_msg, null, "\t").replace(IDRegex, match => IdToEmail(match))
  dom("#student-info").innerHTML = err_msg;
  return true;
}
// gets the email of user with a given ID (for friendly display)
function IdToEmail(id) {
  const arr = users.filter(u => u.id === id);
  return arr[0] ? arr[0].email : 'unknown_email';
}

// sets color of student output
function colorLastUser(isLastUser) {
  dom("#student-info").style.color = isLastUser ? COLORS.GREEN: COLORS.BLACK;
}

function transformURL(url) {
  const isDev = !location.hostname.endsWith("vandyhacks.org");
  // bypass CORS issues in client-side API calls during localhost/dev, see https://github.com/Freeboard/thingproxy
  return isDev ? "https://thingproxy.freeboard.io/fetch/" + url : url;
}

function clearInputs() {
  ["#name", "#nfc"].forEach(e => dom(e).value = "");
}
function clearCheckBoxes() {
  ["#unadmit-checkbox", "#search-checkbox"].forEach(e => {
    dom(e).checked = false;
    dom(e).onchange(); // fire event to update other stuff properly
  });
}
function clearOutput() {
  dom("#student-info").innerHTML = "";
}

// toggle hiding elems
function hideInputs(hide) {
  const elems = ["#name", "#nfc", "#checkboxes"];
  elems.forEach(e => {
    dom(e).style.display = hide ? 'none' : 'block';
  });
}

function isCheckIn() {
  return EVENT && EVENT.eventType === "CheckIn";
}
