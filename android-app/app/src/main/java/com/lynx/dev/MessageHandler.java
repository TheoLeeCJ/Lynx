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
            Toast.makeText(MainActivity.mainActivityStatic, "JSON parse error, please try again!", Toast.LENGTH_SHORT);
            return;
        }
        switch (messageType) {
            case "initial_auth_reply":
                MainActivity.mainActivityStatic.alterHomeMesage(Utility.HOMEMESSAGE_CONNECTED);
                BackgroundService.serviceState.put("connectStatus", "connected");
                break;
            case "remotecontrol_tap":
                int x, y;
                try {
                    x = message.getInt("x");
                    y = message.getInt("y");
                }
                catch (Exception e) {
                    Toast.makeText(MainActivity.mainActivityStatic, "JSON parse error, please try again!", Toast.LENGTH_SHORT);
                    return;
                }
                BackgroundService.backgroundServiceStatic.click(x, y);
                break;
            case "screenstream_request_reply":
                Boolean allowed;
                try {
                    System.out.println(message.getBoolean("success"));
                    allowed = message.getBoolean("success");
                }
                catch (Exception e) {
                    Toast.makeText(MainActivity.mainActivityStatic, "JSON parse error, please try again!", Toast.LENGTH_SHORT);
                    return;
                }
                if (allowed) { // if allowed, send the dimensions and other metadata
                    JSONObject reply = new JSONObject();
                    try {
                        reply.put("type", "meta_sendinfo");

                        JSONObject screenDimensions = new JSONObject();
                        screenDimensions.put("screenWidth", BackgroundService.getScreenWidth());
                        screenDimensions.put("screenHeight", BackgroundService.getScreenHeight());

                        JSONObject screenStreamImageDimensions = new JSONObject();
                        screenStreamImageDimensions.put("imageWidth", 480);
                        screenStreamImageDimensions.put("imageHeight", 854);

                        JSONObject replyData = new JSONObject();
                        replyData.put("screenDimensions", screenDimensions);
                        replyData.put("screenStreamImageDimensions", screenStreamImageDimensions);

                        reply.put("data", replyData);
                    }
                    catch (Exception e) {
                        Toast.makeText(MainActivity.mainActivityStatic, "JSONObject error while generating meta_sendinfo!", Toast.LENGTH_SHORT);
                        return;
                    }
                    System.out.println(reply.toString());
                    SimpleClient.simpleClientStatic.sendText(reply.toString());
                }
                break;
            case "meta_sendinfo_reply":
                MainActivity.screenStreamApprovedByPC = true;
                break;
            default:
                 break;
        }
    }
}
