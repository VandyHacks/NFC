# NFC
nfc app, specific to [this reader](https://www.amazon.com/ACR1252U-Read-Writer-Bonus-NTAG213/dp/B00X4U1OBM)

Potential Dev work
---
https://gototags.com/windows-app/docs/keyboard-emulation/ which uses [sendkey.send](https://docs.microsoft.com/en-us/dotnet/api/system.windows.forms.sendkeys.send)

then, intercept the key fire event somehow (WinForms onkeydown?) and then do a POST to the VH server (use the same endpoints as the QR scanner)
