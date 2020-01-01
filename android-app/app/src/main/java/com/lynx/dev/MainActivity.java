package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.Activity;
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
import android.os.Bundle;
import android.os.Handler;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.webkit.WebView;
import android.content.res.AssetManager;
import android.media.Image.Plane;

import java.io.ByteArrayOutputStream;

public class MainActivity extends AppCompatActivity {
	public WebView webapp = null;
	public AssetManager assetManager = null;
	private WebAppInterface webAppInterface = null;
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
		webapp.loadUrl("https://lynx-staging.gear.host/");
		// webapp.loadUrl("http://192.168.1.241:3000/");

		// Bind WebAppInterface to the webview
		webAppInterface = new WebAppInterface(this, this, webapp);
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
				System.out.println("A");
			} else {
				// No explanation needed; request the permission
				System.out.println("B");
				requestPermission();
			}
		} else {
			// Permission has already been granted
			System.out.println("C");
		}
	}

	public void requestPermission() {
		ActivityCompat.requestPermissions(mainActivity, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 888);
	}

	@Override
	public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
		switch (requestCode) {
			case 888: {
				// If request is cancelled, the result arrays are empty.
				if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
					// permission was granted, yay! Do the
					// contacts-related task you need to do.
					System.out.println("Allowed");
				} else {
					// permission denied, boo! Disable the
					// functionality that depends on this permission.
					System.out.println("User doesn't want to use storage");
					if (ActivityCompat.shouldShowRequestPermissionRationale(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
						// Show an explanation to the user
						webAppInterface.explainPrompt();
						System.out.println("A");
					}
				}
			}

			// other 'case' lines to check for other
			// permissions this app might request.
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
		System.out.println("ATTEMPTING TO START SCREEN CAP");

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
