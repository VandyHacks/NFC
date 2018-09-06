import threading
import urllib.request
import json
import pymongo
from pymongo import MongoClient

# 1. Checks if we are doing the checkin event or not

# Check in procedures
# 1. Checks endpoint for new qr code
# 2. Prompt for nfc scan
# 3. Verify qr and nfc pair
# 4. Write to db

# Marking attendence
# 1. Get student id from db based on nfc uid
# 2. Try to push student id to attendees list of proper event

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
    # TODO - verify qrcode/studentID format
    db = getDb()

    # TODO - possibly have better validation of nfcUID format
    nfcUID = input("\nPlease scan NFC tag\n")
    while len(nfcUID) != 14:
        nfcUID = input("ERROR: Invalid NFC tag, please rescan\n")

    if db['studentID-nfcUID'].find_one( {'studentID': {'$eq': qrcode}} ) != None:
        print("ERROR: Found duplicate QR code\n")
        return

    while db['studentID-nfcUID'].find_one( {'_id': {'$eq': nfcUID}} ) != None:
        print("ERROR: Found duplicate NFC UID\n")
        response = input("Try another tag (y/n)?\n")
        if response != 'n':
            nfcUID = input("\nPlease scan NFC tag\n")
        else:
            print("WARNING: QR code %s was not associated with NFC\n" % qrcode)
            return

    db['studentID-nfcUID'].insert( {"_id": nfcUID, "studentID": qrcode} )

    if db['studentID-nfcUID'].find_one( {
                                        'id': {'$eq': nfcUID},
                                        'studentID': {'$eq': qrcode}
                                        } ) != None:
        print("\nSuccessfully associated student and NFC UID\n")
    else:
        print("\nERROR: Something went wrong writing to db\n")

prevLength = 0
def pollQrData():
    global prevLength
    print("Polling")
    contents = urllib.request.urlopen("http://localhost:3000/qrdata").read().decode("utf-8")

    if prevLength != len(contents):
        prev = len(contents)

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

        entry = db['studentID-nfcUID'].find_one( {'_id': {'$eq': nfcUID}})
        if entry == None:
            print("ERROR: Could not find student for NFC uid")
            continue

        studentID = entry['studentID']
        event = db['events'].find_one( {'_id': {'$eq': 'TEST_EVENT'}} )
        if event == None:
            print("ERROR: could not find eventid")
            break

        if studentID in event['attendees']:
            print("WARNING: student has already attended event")

        db['events'].update( {'_id': 'TEST_EVENT'}, {'$push': {'attendees': studentID}} )

        if studentID in event['attendees']:
            print("Successfully marked attended")
        else:
            print("\nERROR: Something went wrong writing to db\n")



init()
