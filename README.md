# NFC-webapp
NFC web application, using any NFC scanner system that can emulate keyboard input.

### Features:
* Auth code to prevent unauthorized access
* During check-in, can associate students (fuzzy search name/email/school) to NFC UUIDs.
* Event dropdown to select event
* Initially downloads a list of all students, to reduce frequent server GET requests & speed up lookup.
* Backup: can manually fuzzy search students by name/email/school

### Screens:
1. **check-in event**: shows only nfc + search input fields
2. **non-check-in event**: shows either NFC or search input fields, with an `unadmit` checkbox and a `manual search mode` checkbox

* if the `unadmit` checkbox is checked, show a confirmation popup + turn screen red as warning.

### Edge cases:

1. If no user found in user search, then nothing happens on submit
2. If no user corresponds to an NFC scan, shows an error message.


Dev
---
Just a simple static website, no frameworks.

Uses https://github.com/Freeboard/thingproxy to bypass CORS header issues when developing on localhost + non-prod environments
