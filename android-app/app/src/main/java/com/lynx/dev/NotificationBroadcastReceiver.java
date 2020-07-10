package com.lynx.dev;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

public class NotificationBroadcastReceiver extends BroadcastReceiver {
	@Override
	public void onReceive(Context context, Intent intent) {
		// dismiss notification, check if transfer was Accepted or Rejected
		((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(16);
		if (intent.getAction().equals("Reject")) {
			SimpleClient.simpleClientStatic.sendText("{\"type\":\"filetransfer_batch_request_reply\",\"status\":403,\"success\":false,\"message\":\"Forbidden\"}");
			return;
		}

		// check if save directory was specified
		try {
			JSONObject currentSettings = Utility.readSettings(context);
			System.out.println(currentSettings.getString("receiveLocation"));
		}
		catch (Exception e) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
				BackgroundService.backgroundServiceStatic.createNotificationChannel("error", "Errors", NotificationManager.IMPORTANCE_HIGH);
			}

			NotificationCompat.Builder builder = new NotificationCompat.Builder(BackgroundService.backgroundServiceStatic, "error")
				.setSmallIcon(R.mipmap.ic_launcher)
				.setContentTitle("Unable to receive files.")
				.setContentText("Please set a save location in the Lynx app first.")
				.setPriority(NotificationCompat.PRIORITY_HIGH);

			((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).notify(24, builder.build());
			System.out.println(e);

			SimpleClient.simpleClientStatic.sendText("{\"type\":\"filetransfer_batch_request_reply\",\"status\":403,\"success\":false,\"message\":\"Forbidden\"}");
			return;
		}

		// setup file transfer
		FileActions.transferOpen = true;
		SimpleClient.simpleClientStatic.sendText("{\"type\":\"filetransfer_batch_request_reply\",\"status\":200,\"success\":true,\"message\":\"Success\"}");
	}
}
