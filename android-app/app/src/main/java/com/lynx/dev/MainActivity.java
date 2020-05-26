package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.DialogFragment;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
import android.os.Environment;
import android.os.Handler;
import android.provider.Settings;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.content.res.AssetManager;
import android.media.Image.Plane;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.vision.barcode.Barcode;
import com.notbytes.barcode_reader.BarcodeReaderActivity;

import org.json.JSONObject;
import org.slf4j.helpers.Util;

import java.io.ByteArrayOutputStream;
import java.io.File;

public class MainActivity extends AppCompatActivity {
//	public WebView webapp = null;
	public AssetManager assetManager = null;
//	private WebAppInterfaceV2 webAppInterface = null;
	public MainActivity mainActivity = this;
	static MainActivity mainActivityStatic;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// Hide the big bar
		requestWindowFeature(this.getWindow().FEATURE_NO_TITLE);
		getSupportActionBar().hide();

		setContentView(R.layout.activity_main);

		// Try and check Service State
		if (BackgroundService.serviceState.get("connectStatus") == "connected") {
			alterHomeMessage(Utility.HOMEMESSAGE_CONNECTED);
		}
		((TextView) findViewById(R.id.ServiceState)).setText("SERVICE STATE: " + BackgroundService.serviceState.get("connectStatus"));
	}

	// UI - File Picker
	public void showFilePicker(View view) {
		requestForPermission();

		// Prepare Dialog
		Bundle bundle = new Bundle();
		DialogFragment newFragment = new FilePicker();
		newFragment.setArguments(bundle);
		newFragment.show(getSupportFragmentManager(), "FilePicker");
	}

	public final String[] EXTERNAL_PERMS = {Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE};

	public final int EXTERNAL_REQUEST = 138;

	public boolean requestForPermission() {
		boolean isPermissionOn = true;
		final int version = Build.VERSION.SDK_INT;
		if (version >= 23) {
			if (!canAccessExternalSd()) {
				isPermissionOn = false;
				requestPermissions(EXTERNAL_PERMS, EXTERNAL_REQUEST);
			}
		}

		return isPermissionOn;
	}

	public boolean canAccessExternalSd() {
		return (hasPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE));
	}

	private boolean hasPermission(String perm) {
		return (PackageManager.PERMISSION_GRANTED == ContextCompat.checkSelfPermission(this, perm));
	}

	// UI - Stop Screen Sharing (if it was started)
	public void stopScreenShare(View view) {
		BackgroundService.backgroundServiceStatic.tearDownVirtualDisplay();

		Runnable sendStoppedImage = new Runnable() {
			public void run() {
				runOnUiThread(new Runnable() {
					@Override
					public void run() {
						Bitmap dia = BitmapFactory.decodeResource(getResources(), R.mipmap.dia);
						SimpleClient.simpleClientStatic.sendStopImage(dia);
					}
				});
			}
		};

		Handler handler3 = new Handler();

		handler3.postDelayed(sendStoppedImage,1000);
	}

	// UI - Start QR Code Scanner Activity
	public void addDevice(View view) {
		// new QR code reader
		Intent intent = new Intent(this, QRCodeScanner.class);
		startActivityForResult(intent, Utility.ACTIVITY_RESULT_QRCODE);

		// old QR code reader (Google Play Services)
//		Intent launchIntent = BarcodeReaderActivity.getLaunchIntent(this, true, false);
//		startActivityForResult(launchIntent, Utility.ACTIVITY_RESULT_QRCODE);

		// TO BYPASS QR CODE SCANNER:
//		confirmAddDevice("{\"ip\": \"192.168.1.98\", \"connectionToken\": \"2efd17a2-872b-487b-8a44-6977228b369c\" }");
	}

	// UI - Indicate that we're trying to connect
	public void alterHomeMessage(final int homeMessage) {
		runOnUiThread(new Runnable() {
			@Override
			public void run() {
				if (homeMessage == Utility.HOMEMESSAGE_CONNECTING) {
					findViewById(R.id.HomeStatus_Initial).setVisibility(ListView.GONE);
					findViewById(R.id.HomeStatus_Connecting).setVisibility(ListView.VISIBLE);
					findViewById(R.id.HomeStatus_Connected).setVisibility(ListView.GONE);
					((TextView) findViewById(R.id.ConnectingText)).setText("Connecting to " + Utility.IP_ADDR);
				}
				else if (homeMessage == Utility.HOMEMESSAGE_CONNECTED) {
					findViewById(R.id.HomeStatus_Initial).setVisibility(ListView.GONE);
					findViewById(R.id.HomeStatus_Connecting).setVisibility(ListView.GONE);
					findViewById(R.id.HomeStatus_Connected).setVisibility(ListView.VISIBLE);
					((TextView) findViewById(R.id.HomeStatus_Big)).setText("Connected to " + Utility.IP_ADDR);
				}
				else if (homeMessage == Utility.HOMEMESSAGE_NOT_CONNECTED) {
					findViewById(R.id.HomeStatus_Initial).setVisibility(ListView.VISIBLE);
					findViewById(R.id.HomeStatus_Connecting).setVisibility(ListView.GONE);
					findViewById(R.id.HomeStatus_Connected).setVisibility(ListView.GONE);
					((TextView) findViewById(R.id.HomeStatus_Big)).setText("Not connected.");
				}
			}
		});
	}

	// Functions - Connect
	public void openConnection() {
		if (!this.isFinishing()) {
			mainActivityStatic = this;
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
				startForegroundService(new Intent(this, BackgroundService.class));
			}
			else {
				startService(new Intent(this, BackgroundService.class));
			}
		}
	}

	// UI - Open Settings
	public void settingsMenu(View view) {
		Intent intent = new Intent(this, SettingsActivity.class);
		startActivity(intent);
	}

	// UI - Open Accessibility Settings
	public void androidAccessibiitySettings(View view) {
		androidAccessibiitySettingsDirect();
	}

	public void androidAccessibiitySettingsDirect() {
		startActivityForResult(new Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS), 0);
	}

	// UI - Simulate tap
	public void simulateTap(View view) {
		JSONObject reply = new JSONObject();
		try {
			reply.put("type", "remotecontrol_tap");
			reply.put("x", 200);
			reply.put("y", 400);
		}
		catch (Exception e) {
			Toast.makeText(MainActivity.mainActivityStatic, "JSONObject error while generating JSON!", Toast.LENGTH_SHORT);
			return;
		}
		MessageHandler.handleMessage(reply);
	}

	// UI - Show Confirmation Dialog when adding New Device
	public void confirmAddDevice(String deviceData) {
		// Parse JSON
		String ipAddr = "";
		String ipFamily = "";
		String uuid = "";
		try {
			JSONObject deviceDataJSON = new JSONObject(deviceData);

			JSONObject ipInfo = deviceDataJSON.getJSONObject("ipInfo");
			ipAddr = ipInfo.getString("address");
			ipFamily = ipInfo.getString("family");

			uuid = deviceDataJSON.getString("connectionToken");
		}
		catch (Exception e) {
			Toast.makeText(mainActivity,
				"You seem to have scanned an invalid QR code. Please try again.\n(couldn't parse QR code JSON)",
				Toast.LENGTH_LONG).show();
			return;
		}

		// Prepare Dialog
		Bundle bundle = new Bundle();
		bundle.putString("ipAddress", ipAddr);
		bundle.putString("uuid", uuid);
		bundle.putString("ipFamily", ipFamily);
		DialogFragment newFragment = new ConfirmAddDevice();
		newFragment.setArguments(bundle);
		newFragment.show(getSupportFragmentManager(), "ConfirmAddDevice");
	}

	// Debug - Send message to MessageHandler
	public void debugSendToMessageHandler(View view) {
		// Parse JSON
		try {
			String text = ((EditText) findViewById(R.id.JSONMessage)).getText().toString();
			System.out.println(text);
			JSONObject messageJSON = new JSONObject(text);
			MessageHandler.handleMessage(messageJSON);
		}
		catch (Exception e) {
			Toast.makeText(mainActivity,
				"Message isn't valid JSON!",
				Toast.LENGTH_LONG).show();
			return;
		}
	}

	public static boolean isAccessServiceEnabled(Context context, Class accessibilityServiceClass)
	{
		String prefString = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
		return prefString!= null && prefString.contains(context.getPackageName() + "/" + accessibilityServiceClass.getName());
	}

	// ==============================================
	//
	// STORAGE PERMISSIONS
	//
	// ==============================================

//	public void storagePermission() {
//		if (ContextCompat.checkSelfPermission(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
//			// Permission is not granted
//			// Should we show an explanation?
//			if (ActivityCompat.shouldShowRequestPermissionRationale(mainActivity, Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
//				// Show an explanation to the user
//				webAppInterface.explainPrompt();
//			} else {
//				// No explanation needed; request the permission
//				requestPermission();
//			}
//		} else {
//			// Permission has already been granted
//		}
//	}

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
//						webAppInterface.explainPrompt();
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

	public void UIcall_startScreenCapture(View view) {
		BackgroundService.backgroundServiceStatic.startScreenCapture();
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult( requestCode, resultCode, data);
		if (requestCode == BackgroundService.REQUEST_MEDIA_PROJECTION) {
			if (resultCode != Activity.RESULT_OK) {
				Log.i(BackgroundService.TAG, "User cancelled");
				return;
			}
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

			Log.i(BackgroundService.TAG, "Starting screen capture");
			BackgroundService.mResultCode = resultCode;
			BackgroundService.mResultData = data;
			BackgroundService.backgroundServiceStatic.setUpMediaProjection();
			BackgroundService.backgroundServiceStatic.setUpVirtualDisplay();
		}
		// Scanned QR Code
		if (requestCode == Utility.ACTIVITY_RESULT_QRCODE && data != null) {
//			Barcode barcode = data.getParcelableExtra(BarcodeReaderActivity.KEY_CAPTURED_BARCODE);
			confirmAddDevice(data.getData().toString());
		}
	}
}
