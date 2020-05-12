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

Generic Endpoints
===

### Phone -> PC Alerts for Remote Control

```
{ "type": "remotecontrol_error_disabled_service" }
```
Indicates that the user didn't enable the Lynx Accessibility Service. Sent when a remotecontrol command is sent to the phone but the Service wasn't enabled.

It is expected that when the PC receives this, an alert box is shown that prompts the user to look at the phone and enable the Lynx Accessibility Service.

### PC -> Phone Commands for Remote Control

```
{ "type": "remotecontrol_home" }
```
Equivalent to tapping home button on phone.

```
{ "type": "remotecontrol_recents" }
```
Equivalent to tapping recents button on phone.

```
{ "type": "remotecontrol_notifications" }
```
Same.

```
{ "type": "remotecontrol_back" }
```
Same.

```
{
	"type": "remotecontrol_tap",
	"data": {
		"x": xCoordinate,
		"y": yCoordinate
	}
}
```
Simulates a tap on the screen at x, y. The coordinates are in screen-space (i.e. the "real" width and height of the phone)