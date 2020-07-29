package com.lynx.dev;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Handler;
import android.view.View;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.Map;

public class MessageHandler {
    public static boolean remoteControlRequestedInSession = false;

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

                if (!remoteControlRequestedInSession) {
                    remoteControlRequestedInSession = true;

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        BackgroundService.backgroundServiceStatic.createNotificationChannel("error", "Errors", NotificationManager.IMPORTANCE_HIGH);
                    }

                    NotificationCompat.Builder builder = new NotificationCompat.Builder(BackgroundService.backgroundServiceStatic, "error")
                      .setSmallIcon(R.mipmap.lynx_raw)
                      .setContentTitle("Allow Remote Control?")
                      .setContentText("If so, please open the Lynx app and enable the Accessbility Service.")
                      .setPriority(NotificationCompat.PRIORITY_HIGH);

                    NotificationCompat.BigTextStyle bigTextStyle = new NotificationCompat.BigTextStyle();
                    bigTextStyle.setBigContentTitle("Allow Remote Control?");
                    bigTextStyle.bigText("The PC you are connected to via Lynx wants to remotely use this phone. If this is you, please enter the Lynx app and 'Open Accessibility Settings' to enable.");

                    builder.setStyle(bigTextStyle);

                    ((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).notify(24, builder.build());
                }
            }
        }

        switch (messageType) {
            case "filetransfer_file_start":
                if (!FileActions.transferOpen) return;
                try {
                    FileActions.setFileReceiveState(Utility.toMap(message.getJSONObject("data")));
                }
                catch (Exception e) {
                    System.out.println(e);
                }
                break;
            case "filetransfer_file_end":
                if (!FileActions.transferOpen) return;
                try {
                    FileActions.setFileReceiveState(null);
                }
                catch (Exception e) {
                    System.out.println(e);
                }
                break;
            case "filetransfer_batch_request_reply":
                if (!FileActions.transferOpen) return;
                try {
                    if (message.getBoolean("success")) {
                        FileActions.beginBatch();
                    }
                    else {
                        FileActions.transferOpen = false;
                        Toast.makeText(MainActivity.mainActivityStatic,
                          "File transfer was refused.",
                          Toast.LENGTH_SHORT).show();
                    }
                }
                catch (Exception e) {
                    Toast.makeText(MainActivity.mainActivityStatic,
                      "Error" + e.toString(),
                      Toast.LENGTH_SHORT).show();
                }
                break;
            case "filetransfer_batch_request":
                Intent fileAcceptIntent = new Intent(BackgroundService.backgroundServiceStatic, NotificationBroadcastReceiver.class);
                fileAcceptIntent.setAction("Accept");
                PendingIntent fileAcceptPendingIntent =
                  PendingIntent.getBroadcast(BackgroundService.backgroundServiceStatic, 0, fileAcceptIntent, 0);

                Intent fileRejectIntent = new Intent(BackgroundService.backgroundServiceStatic, NotificationBroadcastReceiver.class);
                fileRejectIntent.setAction("Reject");
                PendingIntent fileRejectPendingIntent =
                  PendingIntent.getBroadcast(BackgroundService.backgroundServiceStatic, 0, fileRejectIntent, 0);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    BackgroundService.backgroundServiceStatic.createNotificationChannel("fileReceive", "File Transfer Request", NotificationManager.IMPORTANCE_HIGH);
                }

                NotificationCompat.Builder builder = new NotificationCompat.Builder(BackgroundService.backgroundServiceStatic, "fileReceive")
                  .setSmallIcon(R.mipmap.lynx_raw)
                  .setContentTitle("PC wants to share files with you.")
                  .setContentText("The PC that you're connected to over Lynx wants to send some files to you.")
                  .setPriority(NotificationCompat.PRIORITY_HIGH)
                  .addAction(R.mipmap.lynx_raw, "Accept Files", fileAcceptPendingIntent)
                  .addAction(R.mipmap.lynx_raw, "Reject", fileRejectPendingIntent);

                ((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).notify(16, builder.build());

                break;
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

                        BackgroundService.backgroundServiceStatic.refreshDimensions();

                        JSONObject screenDimensions = new JSONObject();
                        screenDimensions.put("screenWidth", BackgroundService.screenWidth);
                        screenDimensions.put("screenHeight", BackgroundService.screenHeight);

                        JSONObject screenstreamImageDimensions = new JSONObject();
                        screenstreamImageDimensions.put("imageWidth", BackgroundService.streamWidth);
                        screenstreamImageDimensions.put("imageHeight", BackgroundService.streamHeight);

                        JSONObject replyData = new JSONObject();
                        replyData.put("screenDimensions", screenDimensions);
                        replyData.put("screenstreamImageDimensions", screenstreamImageDimensions);
                        replyData.put("orientation", BackgroundService.backgroundServiceStatic
                                .getDeviceOrientation());

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
