Initial Authentication Process
===

1. User clicks button to add new device, after which QR code is shown
2. Phone scans QR code containing a token, and IP, it is JSON encoded
3. Phone opens websocket connection to PC's IP

4. Phone sends an initial WS message to the PC with the token, of type `INITIAL_AUTH`

### Message sent from phone
```
{
	"type": "initial_auth",
	"data": {
		"token": "<token as seen in QR code>"
	}
}
```

5. If token matches phone is allowed in

### Message sent from server (PC)
```
{
	"type": "initial_auth_response",
	"data": {
		"success": true // or false
	}
}
```

6. Streaming data / file / what can now be accepted by the PCs
