package com.lynx.dev;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.FrameLayout;
import android.widget.ImageView;

import java.net.InetSocketAddress;
import java.net.URI;

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

	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {}

	@Override
	public void onInterrupt() {}

	@Override
	public void onCreate() {
		super.onCreate();
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
			System.out.println("ws://" + WebAppInterfaceV2.ip);
			client = new SimpleClient(new URI("ws://" + WebAppInterfaceV2.ip));
			client.webAppInterface = WebAppInterfaceV2.webAppInterface;
			client.connectionToken = WebAppInterfaceV2.connectionToken;
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

		intervalHandler.postDelayed(intervalThread, 0); // comment out when the window isn't required...
		windowManager.addView(cursorView, cursorLayout); // comment out when the window isn't required...

		return START_STICKY;
	}
}
