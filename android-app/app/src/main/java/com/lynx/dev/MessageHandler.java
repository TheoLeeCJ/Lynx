package com.lynx.dev;

import android.view.View;
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
            Toast errorToast = Toast.makeText(MainActivity.mainActivityStatic,
                    "Error retrieving parameter 'type' of WebSocket message.",
                    Toast.LENGTH_SHORT);
            errorToast.show();
            return;
        }

        if (messageType.contains("remotecontrol")) {
            System.out.println("remote control command");
            if (!MainActivity.isAccessServiceEnabled(MainActivity.mainActivityStatic, BackgroundService.class)) {
                System.out.println("remote control command failed - prompting user to enable service");
                Runnable showToast = new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(MainActivity.mainActivityStatic, "Error occurred while generating JSON. This should never happen.", Toast.LENGTH_SHORT).show();
                    }
                };
                MainActivity.mainActivityStatic.androidAccessibiitySettingsDirect();
                JSONObject disabledErrorMessage = new JSONObject();
                try {
                    disabledErrorMessage.put("type", "remotecontrol_error_disabled_service");
                }
                catch (Exception e) {
                    MainActivity.mainActivityStatic.runOnUiThread(showToast);
                }
                SimpleClient.simpleClientStatic.sendText(disabledErrorMessage.toString());
            }
        }

        switch (messageType) {
            case "initial_auth_reply":
                MainActivity.mainActivityStatic.alterHomeMessage(Utility.HOMEMESSAGE_CONNECTED);
                BackgroundService.serviceState.put("connectStatus", "connected");
                break;
            case "remotecontrol_home":
                BackgroundService.backgroundServiceStatic.home();
                break;
            case "remotecontrol_back":
                BackgroundService.backgroundServiceStatic.back();
                break;
            case "remotecontrol_notification":
                BackgroundService.backgroundServiceStatic.notification_center();
                break;
            case "remotecontrol_recents":
                BackgroundService.backgroundServiceStatic.recents();
                break;
            case "remotecontrol_tap":
                float x, y;
                try {
                    JSONObject messageData = message.getJSONObject("data");
                    x = (float) messageData.getDouble("x");
                    y = (float) messageData.getDouble("y");
                }
                catch (Exception e) {
                    Toast errorToast = Toast.makeText(MainActivity.mainActivityStatic,
                            "JSON parse error, please try again!",
                            Toast.LENGTH_SHORT);
                    errorToast.show();
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
                    Toast errorToast = Toast.makeText(MainActivity.mainActivityStatic,
                            "Error retrieving parameter 'success' of WebSocket message.",
                            Toast.LENGTH_SHORT);
                    errorToast.show();
                    return;
                }
                if (allowed) { // if allowed, send the dimensions and other metadata
                    JSONObject reply = new JSONObject();
                    try {
                        reply.put("type", "meta_sendinfo");

                        JSONObject screenDimensions = new JSONObject();
                        screenDimensions.put("screenWidth", BackgroundService.getScreenWidth());
                        screenDimensions.put("screenHeight", BackgroundService.getScreenHeight());

                        JSONObject screenstreamImageDimensions = new JSONObject();
                        screenstreamImageDimensions.put("imageWidth", 480);
                        screenstreamImageDimensions.put("imageHeight", BackgroundService.heightDividedByWidth * 510.0);

                        JSONObject replyData = new JSONObject();
                        replyData.put("screenDimensions", screenDimensions);
                        replyData.put("screenstreamImageDimensions", screenstreamImageDimensions);

                        reply.put("data", replyData);
                    }
                    catch (Exception e) {
                        Toast errorToast = Toast.makeText(MainActivity.mainActivityStatic,
                                "JSONObject error while generating meta_sendinfo!",
                                Toast.LENGTH_SHORT);
                        errorToast.show();
                        return;
                    }
                    System.out.println(reply.toString());
                    SimpleClient.simpleClientStatic.sendText(reply.toString());
                }
                break;
            case "meta_sendinfo_reply":
                BackgroundService.screenStreamApprovedByPC = true;
                break;
            default:
                 break;
        }
    }
}
