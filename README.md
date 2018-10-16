# NFC-webapp
NFC web application, using any NFC scanner system that can emulate keyboard input.

### Features:
* Auth code to prevent unauthorized access
* During check-in, can associate students (fuzzy search name/email/school) to NFC UUIDs.
* Event dropdown to select event
* Initially downloads a list of all students, to reduce frequent server GET requests & speed up lookup.
* Backup: can manually fuzzy search students by name/email/school

Dev
---
Just a simple static website, no frameworks.

Uses https://github.com/Freeboard/thingproxy to bypass CORS header issues when developing on localhost + non-prod environments
