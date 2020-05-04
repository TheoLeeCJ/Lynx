package com.lynx.dev;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import com.google.android.gms.vision.barcode.Barcode;
import com.notbytes.barcode_reader.BarcodeReaderActivity;

import org.json.JSONObject;
import org.slf4j.helpers.Util;

import java.io.ByteArrayOutputStream;
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
	public NotificationManager notificationManager;
	public Notification notification;
	public PendingIntent pendingIntent;

	public static Map<String, String> serviceState = new HashMap<String, String>();

	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {}

	@Override
	public void onInterrupt() {}

	@RequiresApi(Build.VERSION_CODES.O)
	private String createNotificationChannel(String channelId, String channelName) {
		NotificationChannel chan = new NotificationChannel(channelId,
			channelName, NotificationManager.IMPORTANCE_NONE);
		chan.setLightColor(Color.BLUE);
		notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.createNotificationChannel(chan);
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

	public void recents() {
		System.out.println(performGlobalAction(GLOBAL_ACTION_RECENTS));
	}

	@Override
	public void onCreate() {
		super.onCreate();
		backgroundServiceStatic = this;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			createNotificationChannel("connectedToPc", "Lynx Dev");
		}

		Intent notificationIntent = new Intent(this, BackgroundService.class);
		pendingIntent =
			PendingIntent.getActivity(this, 0, notificationIntent, 0);

		// using NotificationCompat.Builder instead of Notification.Builder
		// to support API versions < 26
		notification =
			new NotificationCompat.Builder(this, "connectedToPc")
				.setContentTitle("Lynx Dev")
				.setContentText("Lynx is currently connected to 1 PC.")
				.setSmallIcon(R.drawable.common_full_open_on_phone)
				.setContentIntent(pendingIntent)
				.setTicker("ticker")
				.build();

		startForeground(8, notification);

		IntentFilter filter = new IntentFilter();
		filter.addAction("android.intent.action.CONFIGURATION_CHANGED");
		this.registerReceiver(mBroadcastReceiver, filter);
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

	// ==============================================
	//
	// SCREEN STREAMING CODE
	//
	// ==============================================

	public static final String TAG = "ScreenCaptureFragment";

	public static final int REQUEST_MEDIA_PROJECTION = 1;

	public static int mScreenDensity;

	public static int mResultCode;
	public static Intent mResultData;

	public static MediaProjection mMediaProjection;
	public static VirtualDisplay mVirtualDisplay;
	public static MediaProjectionManager mMediaProjectionManager;

	public static Boolean screenStreamApprovedByPC = false;

	@Override
	public void onDestroy() {
		super.onDestroy();
		this.unregisterReceiver(mBroadcastReceiver);
		tearDownMediaProjection();
	}

	public BroadcastReceiver mBroadcastReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			if (intent.getAction().equals("android.intent.action.CONFIGURATION_CHANGED") ) {
				String orientation;
				if (getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE) {
					orientation = "landscape";

					imageReader.close();
					imageReader = ImageReader.newInstance((int)(BackgroundService.heightDividedByWidth * 480.0), 480, PixelFormat.RGBA_8888, 3);
					imageReader.setOnImageAvailableListener(new ImageAvailable(), new Handler());

					mVirtualDisplay.resize((int)(BackgroundService.heightDividedByWidth * 510.0), 480, mScreenDensity);
				}
				else {
					orientation = "portrait";

					imageReader.close();
					imageReader = ImageReader.newInstance(480, (int)(BackgroundService.heightDividedByWidth * 510.0), PixelFormat.RGBA_8888, 3);
					imageReader.setOnImageAvailableListener(new ImageAvailable(), new Handler());

					mVirtualDisplay.resize(480, (int)(BackgroundService.heightDividedByWidth * 510.0), mScreenDensity);
				}

				JSONObject message = new JSONObject();

				try {
					message.put("type", "screenstream_orientationchange");
					JSONObject data = new JSONObject();
					data.put("orientation", orientation);
					message.put("data", data);
				}
				catch (Exception e) {

				}

				BackgroundService.client.sendText(message.toString());

				mVirtualDisplay.setSurface(imageReader.getSurface());
			}
		}
	};

	public void setUpMediaProjection() {
		mMediaProjection = mMediaProjectionManager.getMediaProjection(mResultCode, mResultData);
	}

	public void tearDownMediaProjection() {
		if (mMediaProjection != null) {
			mMediaProjection.stop();
			mMediaProjection = null;
		}
	}

	public void startScreenCapture() {
		mMediaProjectionManager = (MediaProjectionManager) this.getSystemService(Context.MEDIA_PROJECTION_SERVICE);

		if (mMediaProjection != null) {
			setUpVirtualDisplay();
		} else if (mResultCode != 0 && mResultData != null) {
			setUpMediaProjection();
			setUpVirtualDisplay();
		} else {
			// This initiates a prompt dialog for the user to confirm screen projection.
			MainActivity.mainActivityStatic.startActivityForResult(
				mMediaProjectionManager.createScreenCaptureIntent(),
				REQUEST_MEDIA_PROJECTION);
		}
	}

	ImageReader imageReader = null;

	public void setUpVirtualDisplay() {
		DisplayMetrics metrics = new DisplayMetrics();
		MainActivity.mainActivityStatic.getWindowManager().getDefaultDisplay().getMetrics(metrics);
		mScreenDensity = metrics.densityDpi;

		imageReader = ImageReader.newInstance(480, (int)(BackgroundService.heightDividedByWidth * 510.0), PixelFormat.RGBA_8888, 3);
		imageReader.setOnImageAvailableListener(new ImageAvailable(), new Handler());

		mVirtualDisplay = mMediaProjection.createVirtualDisplay("ScreenCapture",
			480, (int)(BackgroundService.heightDividedByWidth * 510.0), mScreenDensity,
			DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
			imageReader.getSurface(), null, null);
	}

	public static long lastImageMillis = 0;

	public static class ImageAvailable implements ImageReader.OnImageAvailableListener {
		@Override
		public void onImageAvailable(ImageReader reader) {
			final Image image = reader.acquireLatestImage();
			long now = System.currentTimeMillis();
			if ((now - lastImageMillis) < (1000 / 30)) {
				try {
					image.close();
				}
				catch (Exception e) {
					// keep going...
				}
				return;
			}
			lastImageMillis = now;

			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				Bitmap niceCleanBitmap = cleanBitmap(image);
				image.close();

				if (screenStreamApprovedByPC) {
					niceCleanBitmap.compress(Bitmap.CompressFormat.JPEG, 40, baos);
					byte[] imageBytes = baos.toByteArray();

					base64screen = Base64.encodeToString(imageBytes, Base64.DEFAULT);

					JSONObject message = new JSONObject();
					message.put("type", "screenstream_frame");
					JSONObject data = new JSONObject();
					data.put("frame", base64screen);
					message.put("data", data);

//				BackgroundService.client.sendText(base64screen);
					BackgroundService.client.sendText(message.toString());
				}
			}
			catch (Exception e) {
				base64screen = "";
				// keep going...
			}
		}
	}

	public static String base64screen = "";
	public static Bitmap reusableBitmap = null;

	public static Bitmap cleanBitmap(final Image image) {
		Image.Plane plane = image.getPlanes()[0];
		int width = plane.getRowStride() / plane.getPixelStride();
		Bitmap cleanBitmap = null;

		if (width > image.getWidth()) {
			if (reusableBitmap == null) {
				reusableBitmap = Bitmap.createBitmap(width, image.getHeight(), Bitmap.Config.ARGB_8888);
			}

			reusableBitmap.copyPixelsFromBuffer(plane.getBuffer());
			cleanBitmap = Bitmap.createBitmap(reusableBitmap, 0, 0, image.getWidth(), image.getHeight());
		} else {
			cleanBitmap = Bitmap.createBitmap(image.getWidth(), image.getHeight(), Bitmap.Config.ARGB_8888);
			cleanBitmap.copyPixelsFromBuffer(plane.getBuffer());
		}

		return cleanBitmap;
	}
}
