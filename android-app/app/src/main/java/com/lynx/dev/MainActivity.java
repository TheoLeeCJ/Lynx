package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.provider.Settings;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.webkit.WebView;
import android.content.res.AssetManager;
import android.media.Image.Plane;
import android.widget.Toast;

import com.google.android.gms.vision.barcode.Barcode;
import com.notbytes.barcode_reader.BarcodeReaderActivity;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;

public class MainActivity extends AppCompatActivity {
	public WebView webapp = null;
	public AssetManager assetManager = null;
	private WebAppInterfaceV2 webAppInterface = null;
	public MainActivity mainActivity = this;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
//		setContentView(R.layout.activity_main);

		// Hide the big bar
		requestWindowFeature(this.getWindow().FEATURE_NO_TITLE);
		getSupportActionBar().hide();

		// Set up the webview
		webapp = new WebView(this.getApplicationContext());
		setContentView(webapp);
		webapp.getSettings().setJavaScriptEnabled(true);
		webapp.loadUrl("file:///android_asset/webpages/index.html");

		// Bind WebAppInterface to the webview
		webAppInterface = new WebAppInterfaceV2(this, this, webapp);
		webapp.addJavascriptInterface(webAppInterface, "Android");
	}

	@Override
	public void onBackPressed() {
		if (webapp.canGoBack()) {
			webapp.goBack();
		} else {
			super.onBackPressed();
		}
	}

	// Background Service
	private boolean askedForOverlayPermission = false;
	public void startBackgroundService(View view) {
		System.out.println(isAccessServiceEnabled(this, BackgroundService.class));
		if (!Settings.canDrawOverlays(this)) {
			askedForOverlayPermission = true;
			Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
			startActivityForResult(intent, 889);
		}
		else {
			if (!this.isFinishing()) {
				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
					startForegroundService(new Intent(this, BackgroundService.class));
				}
				else {
					Toast.makeText(mainActivity, "Unfortunately, I have not implemented support for versions below Android Oreo.", Toast.LENGTH_SHORT).show();
				}
			}
		}
	}

	public boolean isAccessServiceEnabled(Context context, Class accessibilityServiceClass)
	{
		String prefString = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
		return prefString!= null && prefString.contains(context.getPackageName() + "/" + accessibilityServiceClass.getName());
	}

	// QR Code
	public void qrCode() {
		Intent launchIntent = BarcodeReaderActivity.getLaunchIntent(this, true, false);
		startActivityForResult(launchIntent, 199);
	}

	// ==============================================
	//
	// STORAGE PERMISSIONS
	//
	// ==============================================

	public void storagePermission() {
		if (ContextCompat.checkSelfPermission(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
			// Permission is not granted
			// Should we show an explanation?
			if (ActivityCompat.shouldShowRequestPermissionRationale(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
				// Show an explanation to the user
				webAppInterface.explainPrompt();
			} else {
				// No explanation needed; request the permission
				requestPermission();
			}
		} else {
			// Permission has already been granted
		}
	}

	public void requestPermission() {
		ActivityCompat.requestPermissions(mainActivity, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 888);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		switch (requestCode) {
			case 888: {
				if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
					// permission was granted
					System.out.println("Allowed");
				} else {
					// permission denied
					System.out.println("User doesn't want to use storage");
					if (ActivityCompat.shouldShowRequestPermissionRationale(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
						// Show an explanation to the user
						webAppInterface.explainPrompt();
						System.out.println("A");
					}
				}
			}
			case 889: {
				startService(new Intent(this, BackgroundService.class));
			}

			// other 'case' lines to check for other permissions this app might request.
		}
	}

	// ==============================================
	//
	// SCREEN STREAMING CODE
	//
	// ==============================================

	private static final String TAG = "ScreenCaptureFragment";

	private static final int REQUEST_MEDIA_PROJECTION = 1;

	private int mScreenDensity;

	private int mResultCode;
	private Intent mResultData;

	private MediaProjection mMediaProjection;
	private VirtualDisplay mVirtualDisplay;
	private MediaProjectionManager mMediaProjectionManager;

	@Override
	public void onDestroy() {
		super.onDestroy();
		webAppInterface.stopWebsocketServer();
		tearDownMediaProjection();
	}

	private void setUpMediaProjection() {
		mMediaProjection = mMediaProjectionManager.getMediaProjection(mResultCode, mResultData);
	}

	private void tearDownMediaProjection() {
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
			startActivityForResult(
				mMediaProjectionManager.createScreenCaptureIntent(),
				REQUEST_MEDIA_PROJECTION);
		}
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult( requestCode, resultCode, data);
		if (requestCode == REQUEST_MEDIA_PROJECTION) {
			if (resultCode != Activity.RESULT_OK) {
				Log.i(TAG, "User cancelled");
				return;
			}
			Log.i(TAG, "Starting screen capture");
			mResultCode = resultCode;
			mResultData = data;
			setUpMediaProjection();
			setUpVirtualDisplay();
		}
		if (requestCode == 199 && data != null) {
			Barcode barcode = data.getParcelableExtra(BarcodeReaderActivity.KEY_CAPTURED_BARCODE);
			webAppInterface.qrCodeResult(barcode.rawValue);
		}
	}

	ImageReader imageReader = null;

	private void setUpVirtualDisplay() {
		DisplayMetrics metrics = new DisplayMetrics();
		this.getWindowManager().getDefaultDisplay().getMetrics(metrics);
		mScreenDensity = metrics.densityDpi;

		Log.i(TAG, "Setting up a VirtualDisplay: " +
			480 + "x" + 854 +
			" (" + mScreenDensity + ")");

		imageReader = ImageReader.newInstance(480, 854, PixelFormat.RGBA_8888, 3);
		imageReader.setOnImageAvailableListener(new ImageAvailable(), new Handler());

		mVirtualDisplay = mMediaProjection.createVirtualDisplay("ScreenCapture",
			480, 854, mScreenDensity,
			DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
			imageReader.getSurface(), null, null);
	}

	private static long lastImageMillis = 0;

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
			catch (Exception e) {
				base64screen = "";
				// keep going...
			}
		}
	}

	public static String base64screen = "";
	public static Bitmap reusableBitmap = null;

	public static Bitmap cleanBitmap(final Image image) {
		Plane plane = image.getPlanes()[0];
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

	private void stopScreenCapture() {
		if (mVirtualDisplay == null) {
			return;
		}
		mVirtualDisplay.release();
		mVirtualDisplay = null;
	}
}
