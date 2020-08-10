package com.lynx.dev;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
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
import android.view.Display;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.net.URI;
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
	public static boolean fixAppliedInSession = false;
	private View cursorView;
	private WindowManager.LayoutParams cursorLayout;
	private WindowManager windowManager;
	private ImageView cursorImageView;
	public static int globalX = 0;
	public static int globalY = 0;
	public static BackgroundService backgroundServiceStatic;
	public NotificationManager notificationManager;
	public Notification notification;
	public PendingIntent pendingIntent;

	public static Map<String, String> serviceState = new HashMap<String, String>();

	public static float screenWidth, screenHeight;
	public static float streamWidth, streamHeight;
	public static float resolution = (float) 540.0;

	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {}

	@Override
	public void onInterrupt() {}

	@RequiresApi(Build.VERSION_CODES.O)
	public String createNotificationChannel(String channelId, String channelName, int importance) {
		NotificationChannel chan = new NotificationChannel(channelId,
			channelName, importance);
		chan.setLightColor(Color.BLUE);
		notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.createNotificationChannel(chan);
		return channelId;
	}

	public void refreshDimensions() {
		WindowManager window = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
		Display display = window.getDefaultDisplay();

//		screenWidth = (float) display.getWidth();
//		screenHeight = (float) display.getHeight();

		Point size = new Point();
//		display.getSize(size);
		display.getRealSize(size);

		screenWidth = size.x;
		screenHeight = size.y;

		if (screenHeight > screenWidth) {
			float factor = resolution / screenWidth;
			streamWidth = resolution;
			streamHeight = factor * screenHeight;
		}
		else {
			float factor = resolution / screenHeight;
			streamWidth = factor * screenWidth;
			streamHeight = resolution;
		}

		System.out.println("Refreshed Dimensions: " + screenWidth + " " + screenHeight + "; " + streamWidth + " " + streamHeight);
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

	public static void fixedSwipe(int direction) {
		try {
			GestureDescription.Builder gestureBuilder = new GestureDescription.Builder();
			Path path = new Path();

			System.out.println(screenWidth + " " + screenHeight);

			GestureResultCallback callback = new AccessibilityService.GestureResultCallback() {
				@Override
				public void onCompleted(GestureDescription gestureDescription) {
					System.out.println("gesture completed");
					super.onCompleted(gestureDescription);
				}

				@Override
				public void onCancelled(GestureDescription gestureDescription) {
					System.out.println("gesture cancelled");
					super.onCancelled(gestureDescription);
				}
			};

			if (direction == 1) {
				//Swipe left
				path.moveTo(screenWidth - 10, (screenHeight / 2));
				path.lineTo(0, (screenHeight / 2));
			}
			else if (direction == 2) {
				//Swipe right
				path.moveTo(0, (screenHeight / 2));
				path.lineTo(screenWidth - 10, (screenHeight / 2));
			}
			else if (direction == 3) {
				//Swipe top
				path.moveTo((screenWidth / 2), screenHeight - 50);
				path.lineTo((screenWidth / 2), 0);
			}
			else if (direction == 4) {
				//Swipe bottom
				path.moveTo((screenWidth / 2), 0);
				path.lineTo((screenWidth / 2), screenHeight - 50);
			}

			gestureBuilder.addStroke(new GestureDescription.StrokeDescription(path, 100, 1000));
			BackgroundService.backgroundServiceStatic.dispatchGesture(gestureBuilder.build(), callback, null);
		}
		catch (Exception e) {
			System.out.println(e);
		}
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

	Handler fixRemoteControl = new Handler();
	Runnable fixRemoteControlRunnable = new Runnable() {
		@Override
		public void run() {
			try {
				fixAppliedInSession = true;
				SimpleClient.simpleClientStatic.sendText("{ \"type\": \"screenstream_orientationchange\", \"data\": { \"orientation\": \"landscape\" } }");
				Thread.sleep(500);
				SimpleClient.simpleClientStatic.sendText("{ \"type\": \"screenstream_orientationchange\", \"data\": { \"orientation\": \"portrait\" } }");
				System.out.println("This should only run once");
			}
			catch (Exception e) {}
		}
	};

	@Override
	public void onServiceConnected() {
		System.out.println("CREATED");
		if (SimpleClient.simpleClientStatic != null) {
			SimpleClient.simpleClientStatic.sendText("{\"type\":\"remotecontrol_enabled\"}");
		}
	}

	@Override
	public boolean onUnbind(Intent intent) {
		System.out.println("CREATED");
		if (SimpleClient.simpleClientStatic != null) {
			SimpleClient.simpleClientStatic.sendText("{\"type\":\"remotecontrol_disabled\"}");
		}
		return false;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		backgroundServiceStatic = this;

		refreshDimensions();

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			createNotificationChannel("connectedToPc", "Lynx Dev", NotificationManager.IMPORTANCE_LOW);
		}

		Intent notificationIntent = new Intent(this, BackgroundService.class);
		pendingIntent =
			PendingIntent.getActivity(this, 0, notificationIntent, 0);

		// using NotificationCompat.Builder instead of Notification.Builder
		// to support API versions < 26
		notification =
			new NotificationCompat.Builder(this, "connectedToPc")
				.setSmallIcon(R.mipmap.lynx_raw)
				.setContentTitle("Lynx Dev")
				.setContentText("Lynx is currently connected to 1 PC.")
				.setContentIntent(pendingIntent)
				.setTicker("ticker")
				.build();

		startForeground(8, notification);

		IntentFilter filter = new IntentFilter();
		filter.addAction("android.intent.action.CONFIGURATION_CHANGED");
		this.registerReceiver(mBroadcastReceiver, filter);

//		{
//			DisplayMetrics metrics = new DisplayMetrics();
//
//			WindowManager window = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
//			Display display = window.getDefaultDisplay();
//
//			currentRotation = display.getRotation();
//		}

//		handler3.postDelayed(updateData,1000);
	}

	Handler handler3 = new Handler();

	// inactive code, but don't remove it!!!
	private Runnable updateData = new Runnable() {
		public void run() {
			if (imageReader != null) {
				DisplayMetrics metrics = new DisplayMetrics();

				WindowManager window = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
				Display display = window.getDefaultDisplay();

				int newRotation = display.getRotation();
				System.out.println(currentRotation);
				System.out.println(newRotation);

				if (currentRotation != newRotation) {
					refreshDimensions();
					try {
						Thread.sleep(1000);
					}
					catch (Exception e) {

					}

					System.out.println("ROTATE");

					tearDownVirtualDisplay();
					setUpVirtualDisplay();

					currentRotation = newRotation;
				}
			}

			handler3.postDelayed(updateData,1000);
		}
	};

	int currentRotation;

	public static SimpleClient client;

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		// start WebSocket client
		try {
			System.out.println(Utility.CONNECTION_URL);
			client = new SimpleClient(new URI(Utility.CONNECTION_URL));
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
		tearDownVirtualDisplay();
	}

	public String getDeviceOrientation() {
		int orientation = getResources().getConfiguration().orientation;
		if (orientation == Configuration.ORIENTATION_PORTRAIT) {
			return "portrait";
		} else if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
			return "landscape";
		} else {
			Log.e("getDeviceOrientation()",
					"Orientation value is neither portrait nor landscape");
			return "";
		}
	}

	// handle screen rotation (landscape to portrait, etc)
	public BroadcastReceiver mBroadcastReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			if (intent.getAction().equals("android.intent.action.CONFIGURATION_CHANGED") && (mVirtualDisplay != null)) {
				String orientation = getDeviceOrientation();

				tearDownVirtualDisplay();
				setUpVirtualDisplay();

				JSONObject message = new JSONObject();

				try {
					message.put("type", "screenstream_orientationchange");
					JSONObject data = new JSONObject();
					data.put("orientation", orientation);
					message.put("data", data);
				}
				catch (Exception e) {
					System.out.println("JSON generation failed; this should never ever happen!!!");
				}

				BackgroundService.client.sendText(message.toString());
				System.out.println("OK change dimension");
			}
		}
	};

	public void setUpMediaProjection() {
		mMediaProjection = mMediaProjectionManager.getMediaProjection(mResultCode, mResultData);
	}

	public void tearDownVirtualDisplay() {
		if (mVirtualDisplay != null) {
			mVirtualDisplay.release();
			mVirtualDisplay = null;
			imageReader.close();
			imageReader = null;
			reusableBitmap = null;

			refreshDimensions();
		}
	}

	public void startScreenCapture() {
		mMediaProjectionManager = (MediaProjectionManager) this.getSystemService(Context.MEDIA_PROJECTION_SERVICE);

		if (mMediaProjection != null) {
			sendScreenStreamRequest();
			setUpVirtualDisplay();
		} else if (mResultCode != 0 && mResultData != null) {
			sendScreenStreamRequest();
			setUpMediaProjection();
			setUpVirtualDisplay();
		} else {
			// This initiates a prompt dialog for the user to confirm screen projection.
			MainActivity.mainActivityStatic.startActivityForResult(
				mMediaProjectionManager.createScreenCaptureIntent(),
				REQUEST_MEDIA_PROJECTION);
		}
	}

	public void sendScreenStreamRequest() {
		// SEND REQUEST TO PC
		JSONObject reply = new JSONObject();
		try {
			reply.put("type", "screenstream_request");
		}
		catch (Exception e) {
			Toast.makeText(MainActivity.mainActivityStatic, "JSONObject error while making screenstream_request!", Toast.LENGTH_SHORT).show();
			return;
		}
		SimpleClient.simpleClientStatic.sendText(reply.toString());
		// END
	}

	ImageReader imageReader = null;

	public void setUpVirtualDisplay() {
		refreshDimensions();

		DisplayMetrics metrics = new DisplayMetrics();

		WindowManager window = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
		Display display = window.getDefaultDisplay();
		display.getRealMetrics(metrics);

		mScreenDensity = metrics.densityDpi;

		imageReader = null;
		imageReader = ImageReader.newInstance((int) streamWidth, (int) streamHeight, PixelFormat.RGBA_8888, 3);
		imageReader.setOnImageAvailableListener(new ImageAvailable(), new Handler());

		if (!fixAppliedInSession) fixRemoteControl.postDelayed(fixRemoteControlRunnable, 1000);

		mVirtualDisplay = mMediaProjection.createVirtualDisplay("ScreenCapture",
			(int) streamWidth, (int) streamHeight, mScreenDensity,
//			DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
			DisplayManager.VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY,
//			DisplayManager.VIRTUAL_DISPLAY_FLAG_PUBLIC,
			imageReader.getSurface(), null, null);
	}

	public static long lastImageMillis = 0;

	public static class ImageAvailable implements ImageReader.OnImageAvailableListener {
		@Override
		public void onImageAvailable(ImageReader reader) {
			Image image;
			try {
				image = reader.acquireLatestImage();
				long now = System.currentTimeMillis();
				if ((now - lastImageMillis) < (1000 / 30)) {
					try {
						image.close();
					} catch (Exception e) {
						// keep going...
					}
					return;
				}
				lastImageMillis = now;
			}
			catch (Exception e) {
				System.out.println("HELP");
				return;
			}

			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				Bitmap niceCleanBitmap = cleanBitmap(image);
				image.close();

				if (screenStreamApprovedByPC) {
					niceCleanBitmap.compress(Bitmap.CompressFormat.JPEG, 45, baos);
					byte[] imageBytes = baos.toByteArray();

					base64screen = Base64.encodeToString(imageBytes, Base64.DEFAULT);

					try {
						JSONObject message = new JSONObject();
						message.put("type", "screenstream_frame");
						JSONObject data = new JSONObject();
						data.put("frame", base64screen);
						message.put("data", data);
						BackgroundService.client.sendText(message.toString());
					}
					catch (Exception e) {

					}
				}
			}
			catch (Exception e) {
				System.out.println(e);
				base64screen = "";
			}

			try {
				image.close();
			}
			catch (Exception e) {

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
			try {
				cleanBitmap = Bitmap.createBitmap(reusableBitmap, 0, 0, image.getWidth(), image.getHeight());
			}
			catch (Exception e) {
				cleanBitmap = Bitmap.createBitmap(image.getWidth(), image.getHeight(), Bitmap.Config.ARGB_8888);
				cleanBitmap.copyPixelsFromBuffer(plane.getBuffer());
			}
		} else {
			cleanBitmap = Bitmap.createBitmap(image.getWidth(), image.getHeight(), Bitmap.Config.ARGB_8888);
			cleanBitmap.copyPixelsFromBuffer(plane.getBuffer());
		}

		return cleanBitmap;
	}
}
