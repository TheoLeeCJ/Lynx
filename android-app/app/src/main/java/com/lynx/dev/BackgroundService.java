package com.lynx.dev;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;

import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;

public class BackgroundService extends AccessibilityService {
	android.os.Handler intervalHandler = new android.os.Handler();
	private Runnable intervalThread = new Runnable() {
		public void run() {
		FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
		lp.setMargins(globalX, globalY, 0, 0);
		globalX += 5; globalY += 10;
		cursorImageView.setLayoutParams(lp);

		intervalHandler.postDelayed(this, 1000);
		}
	};

	private View cursorView;
	private int a;
	private WindowManager.LayoutParams cursorLayout;
	private WindowManager windowManager;
	private ImageView cursorImageView;
	private LinearLayout.LayoutParams offsetLayoutParams;
	public static int globalX = 0;
	public static int globalY = 0;

	public WebSocketServer server;

	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {}

	@Override
	public void onInterrupt() {}

	@Override
	public void onCreate() {
		super.onCreate();

		// start WebSocket server (?)
		try {
//			server = new SimpleServer(new InetSocketAddress("192.168.1.225", 9090), getBaseContext());
//			server.start();
//			android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
		}
		catch (Exception e) {

		}
	}

	@Override
	public void onDestroy() {
		super.onDestroy();

//		if (windowManager != null && cursorView != null) {
//			windowManager.removeView(cursorView);
//		}
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		// show cursor
		cursorView = View.inflate(getBaseContext(), R.layout.cursor, null);
		cursorImageView = cursorView.findViewById(R.id.imageView);

		cursorLayout = new WindowManager.LayoutParams();
		cursorLayout.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
		cursorLayout.flags = WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
		cursorLayout.format = PixelFormat.TRANSLUCENT;
		cursorLayout.gravity = Gravity.TOP | Gravity.LEFT;
		cursorLayout.x = 0;
		cursorLayout.y = 800;

		windowManager = (WindowManager) getBaseContext().getSystemService(WINDOW_SERVICE);

		intervalHandler.postDelayed(intervalThread, 0);

		// oooooooo
		System.out.println(getBaseContext());
		System.out.println(cursorLayout.token);
		windowManager.addView(cursorView, cursorLayout);
		return START_STICKY;
	}
}
