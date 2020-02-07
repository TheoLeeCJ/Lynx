package com.lynx.dev;

import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

public class MessageHandler {
    static void handleMessage(final JSONObject message) {
        String messageType = "";
        try {
            messageType = message.getString("type");
        }
        catch (JSONException e) {
            Toast.makeText(MainActivity.mainActivityStatic, "JSON parse error", Toast.LENGTH_SHORT);
            return;
        }
        switch (messageType) {
            case "initial_auth_reply":
                MainActivity.mainActivityStatic.alterHomeMesage(Utility.HOMEMESSAGE_CONNECTED);
                break;
            default:
                 break;
        }
    }
}
