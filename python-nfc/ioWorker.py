import threading
import urllib.request
import json
import pymongo
from pymongo import MongoClient

# 1. Checks for endpoint to have new QR code
# 2. Prompts for new NFC UID to associate with QR code.
#    This will be autopasted in by GoTo tag reader.
# 3. Load json and validate that the QR code and NFC UID haven't been added.
# 4. Write the new pair into the json

#TODO - Implement a way to actually quit

def init():
    #eventid = urllib.request.urlopen("http://localhost:3000/eventid").read().decode("utf-8")
    eventid = 1 
    if eventid == 0:
        pollQrData()
    else:
        markAttendance(eventid)

def getDb():
    connection = MongoClient("ds231720.mlab.com", 31720)
    db = connection['test-db']
    db.authenticate('testuser', 'testpassword1')
    return db

def getNFCforQR(qrcode): 
    db = getDb()
    nfcUID = input("\nPlease scan NFC tag\n")
    while len(nfcUID) != 14:
        nfcUID = input("Invalid NFC tag, please rescan\n")

    if db['studentID-nfcUID'].find_one( {'studentID': {'$eq': qrcode}} ) != None:
        print("ERROR: Found duplicate QR code\n")
        return

    while db['studentID-nfcUID'].find_one( {'_id' : {'$eq': nfcUID}} ) != None:
        print("ERROR: Found duplicate NFC UID\n")
        response = input("Try another tag (y/n)?\n")
        if response != 'n':
            nfcUID = input("\nPlease scan NFC tag\n")
        else:
            print("WARNING: QR code %s was not associated with NFC\n" % qrcode)
        return

    db = getDb()
    db['studentID-nfcUID'].insert( {"_id": nfcUID, "studentID": qrcode} )

    # TODO - probably actually verify this
    print("\n Successfully asssociated student and NFC UID\n")

prev = ""
def pollQrData():
    global prev
    print("Polling")
    contents = urllib.request.urlopen("http://localhost:3000/qrdata").read().decode("utf-8")

    if prev != contents:
        print("Endpoint updated")
        prev = contents

        #split last word and remove ']'
        qrcode = contents.rsplit(',', 1)[-1][:-1]

        print("Found new QR code")
        print(qrcode)
        getNFCforQR(qrcode)

    threading.Timer(1.0, pollQrData).start()

def markAttendance(eventid):
    db = getDb()
    while True:
        nfcUID = input("\nPlease scan NFC tag\n")
        while len(nfcUID) != 14:
            nfcUID = input("Invalid NFC tag, please rescan\n")
        entry = db['studentID-nfcUID'].find_one( {'_id' : {'$eq': nfcUID}})
        if entry == None:
            print("Could not find student for NFC uid")
            continue

        studentID = entry['studentID']
        db['events'].update( {'_id': 'TEST_EVENT'}, {'$push': {'attendees': studentID}} )

        #TODO - verify 
        print("Marked attended")
        
init()
