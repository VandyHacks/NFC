# NFC
nfc app, using [this reader](https://www.amazon.com/ACR1252U-Read-Writer-Bonus-NTAG213/dp/B00X4U1OBM)

Dev
---

### Node.js server to mock constantly updating url (`/node-nfc`)
To run (make sure Node and NPM is installed):
```
# install deps
npm i
# start server
npm start
```
Serves live updating array (as a JSON string) to `localhost:3000/qrdata`. Use this to mock constantly scanning QR data (an array of unique student IDs). The goal is to associate each unique student ID with a NFC UUID.


### C# GotoTag app (`/nfc-app`)
https://gototags.com/windows-app/docs/keyboard-emulation/ which uses [sendkey.send](https://docs.microsoft.com/en-us/dotnet/api/system.windows.forms.sendkeys.send)

then, intercept the key fire event somehow (WinForms onkeydown?) and then do a POST to the VH server (use the same endpoints as the QR scanner)
