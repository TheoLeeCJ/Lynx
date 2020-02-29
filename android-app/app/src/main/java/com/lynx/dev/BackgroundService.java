package com.lynx.dev;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.FrameLayout;
import android.widget.ImageView;

import androidx.annotation.RequiresApi;

import org.slf4j.helpers.Util;

import java.net.InetSocketAddress;
import java.net.URI;
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class BackgroundService extends AccessibilityService {
	android.os.Handler intervalHandler = new android.os.Handler();
	private Runnable intervalThread = new Runnable() {
		public void run() {
//		FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
//		lp.setMargins(globalX, globalY, 0, 0);
//		globalX += 5; globalY += 10;
//		cursorImageView.setLayoutParams(lp);
		if (command == "home") {
			System.out.println(performGlobalAction(GLOBAL_ACTION_HOME));
			command = "";
		}

		intervalHandler.postDelayed(this, 500);
		}
	};

	public static String command;
	private View cursorView;
	private WindowManager.LayoutParams cursorLayout;
	private WindowManager windowManager;
	private ImageView cursorImageView;
	public static int globalX = 0;
	public static int globalY = 0;
	public static BackgroundService backgroundServiceStatic;
	public static double heightDividedByWidth = (double)BackgroundService.getScreenHeight() / (double)BackgroundService.getScreenWidth();

	public static Map<String, String> serviceState = new HashMap<String, String>();

	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {}

	@Override
	public void onInterrupt() {}

	@RequiresApi(Build.VERSION_CODES.O)
	private String createNotificationChannel(String channelId , String channelName) {
		NotificationChannel chan = new NotificationChannel(channelId,
			channelName, NotificationManager.IMPORTANCE_NONE);
		chan.setLightColor(Color.BLUE);
		NotificationManager aaa = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		aaa.createNotificationChannel(chan);
		return channelId;
	}

	public static int getScreenWidth() {
		return Resources.getSystem().getDisplayMetrics().widthPixels;
	}

	public static int getScreenHeight() {
		return Resources.getSystem().getDisplayMetrics().heightPixels;
	}

	// (x, y) in screen coordinates
	private static GestureDescription createClick(float x, float y) {
		// for a single tap a duration of 1 ms is enough
		final int DURATION = 1;

		Path clickPath = new Path();
		clickPath.moveTo(x, y);
		GestureDescription.StrokeDescription clickStroke = new GestureDescription.StrokeDescription(clickPath, 0, DURATION);
		GestureDescription.Builder clickBuilder = new GestureDescription.Builder();
		clickBuilder.addStroke(clickStroke);

		return clickBuilder.build();
	}

	public void click(float x, float y) {
		GestureResultCallback callback = new AccessibilityService.GestureResultCallback() {
			@Override
			public void onCompleted(GestureDescription gestureDescription) {
				super.onCompleted(gestureDescription);
			}

			@Override
			public void onCancelled(GestureDescription gestureDescription) {
				super.onCancelled(gestureDescription);
			}
		};

		boolean result = dispatchGesture(createClick(x, y), callback, null);
	}

	public void home() {
		System.out.println(performGlobalAction(GLOBAL_ACTION_HOME));
	}

	public void back() {
		System.out.println(performGlobalAction(GLOBAL_ACTION_BACK));
	}

	public void notification_center() {
		System.out.println(performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS));
	}

	@Override
	public void onCreate() {
		super.onCreate();
		backgroundServiceStatic = this;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			createNotificationChannel("AAAAA", "Lynx Dev");
			Intent notificationIntent = new Intent(this, BackgroundService.class);
			PendingIntent pendingIntent =
				PendingIntent.getActivity(this, 0, notificationIntent, 0);

			Notification notification =
				new Notification.Builder(this, "AAAAA")
					.setContentTitle("Lynx Dev")
					.setContentText("Lynx is currently connected to 1 PC.")
					.setSmallIcon(R.drawable.common_full_open_on_phone)
					.setContentIntent(pendingIntent)
					.setTicker("ticker")
					.build();

			startForeground(8, notification);
		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();

//		if (windowManager != null && cursorView != null) {
//			windowManager.removeView(cursorView);
//		}
	}

	public static SimpleClient client;

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		// start WebSocket client (?)
		try {
			System.out.println("ws://" + Utility.IP_ADDR);
			client = new SimpleClient(new URI("ws://" + Utility.IP_ADDR + ":" + Utility.WEBSOCKET_PORT));
			client.connectionToken = Utility.CONNECTION_TOKEN;
			client.connect();
			android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
		}
		catch (Exception e) {
			System.out.println("websocket client error: " + e.toString());
		}

		// show cursor
		cursorView = View.inflate(getBaseContext(), R.layout.cursor, null);
		cursorImageView = cursorView.findViewById(R.id.imageView);

		cursorLayout = new WindowManager.LayoutParams();

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) cursorLayout.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
		else cursorLayout.type = WindowManager.LayoutParams.TYPE_TOAST;

		cursorLayout.flags = WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
		cursorLayout.format = PixelFormat.TRANSLUCENT;
		cursorLayout.gravity = Gravity.TOP | Gravity.LEFT;

		windowManager = (WindowManager) getBaseContext().getSystemService(WINDOW_SERVICE);

//		intervalHandler.postDelayed(intervalThread, 0); // comment out when the window isn't required...
//		windowManager.addView(cursorView, cursorLayout); // comment out when the window isn't required...

		return START_STICKY;
	}
}
