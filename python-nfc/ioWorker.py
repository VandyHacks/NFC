import threading
import urllib2
import json

# 1. Checks for endpoint to have new QR code
# 2. Prompts for new NFC UID to associate with QR code.
#    This will be autopasted in by GoTo tag reader.
# 3. Load json and validate that the QR code and NFC UID haven't been added.
# 4. Write the new pair into the json

def getNFCforQR(qrcode): 
    with open("qr-nfc-pairs.json", mode = "r") as jsonfile:
        jsondata = json.load(jsonfile) 
        nfcUID = raw_input("\nPlease scan NFC tag.\n")
        for key in jsondata:
            if key == qrcode:
                print "Found duplicate QR code"
                return
            elif jsondata[key] == nfcUID:
                print "Found duplicate NFC UID"
                return
        
    with open("qr-nfc-pairs.json", mode = "w") as jsonfile:
        jsondata[qrcode] = nfcUID
        json.dump(jsondata, jsonfile)
        print "Wrote new qr-nfc pair to json\n"

prev = ""
def poll():
    global prev
    print "Polling"
    contents = urllib2.urlopen("http://localhost:3000/qrdata").read()

    if prev != contents:
        print "Endpoint updated"
        prev = contents

        #split last word and remove ']'
        qrcode = contents.rsplit(',', 1)[-1][:-1]

        print "Found new QR code "  
        print qrcode
        getNFCforQR(qrcode)

    threading.Timer(1.0, poll).start()
    
poll()
