# NFC
nfc app, using [this reader](https://www.amazon.com/ACR1252U-Read-Writer-Bonus-NTAG213/dp/B00X4U1OBM)

* Auth code to prevent unauthorized access
* During check-in, can associate student unique short codes to NFC UUIDs.
* Event dropdown to select event
* Backup: can manually enter short-codes to mark event attendance

Dev
---
Just a static website

Uses https://github.com/Freeboard/thingproxy to bypass CORS header issues when developing on localhost + non-prod environments