package com.lynx.dev;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.documentfile.provider.DocumentFile;
import androidx.fragment.app.DialogFragment;

import android.Manifest;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
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
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
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

import org.json.JSONObject;
import org.slf4j.helpers.Util;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;

import static android.os.FileUtils.closeQuietly;

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

		// Set mainActivityStatic
		mainActivityStatic = this;
	}

	// UI - File Picker
	public void showFilePicker(View view) {
		requestForPermission();

		// Prepare Dialog
//		Bundle bundle = new Bundle();
//		DialogFragment newFragment = new FilePicker();
//		newFragment.setArguments(bundle);
//		newFragment.show(getSupportFragmentManager(), "FilePicker");

		// System File Picker???
		Intent chooseFile;
		Intent intent;
		chooseFile = new Intent(Intent.ACTION_GET_CONTENT);
		chooseFile.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
//		chooseFile.addCategory(Intent.CATEGORY_OPENABLE);
		chooseFile.setType("*/*");
		intent = Intent.createChooser(chooseFile, "Choose a file");
		startActivityForResult(intent, Utility.ACTIVITY_RESULT_FILECHOSEN);
	}

	// UI - Set save location for transferred files
	public void setSaveLocation(View view) {
		// System File Picker???
		Intent chooseFolder;
		Intent intent;
		chooseFolder = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
		chooseFolder.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
//		chooseFile.addCategory(Intent.CATEGORY_OPENABLE);
		startActivityForResult(chooseFolder, Utility.ACTIVITY_RESULT_SAVELOCATIONCHOSEN);
	}

//	public String getRealPathFromURI(Uri contentUri) {
//		String [] proj      = {MediaStore.Images.Media.DATA};
//		Cursor cursor       = getContentResolver().query( contentUri, proj, null, null,null);
//		if (cursor == null) return null;
//		int column_index    = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
//		cursor.moveToFirst();
//		return cursor.getString(column_index);
//	}

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
		super.onActivityResult(requestCode, resultCode, data);

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

		// Send files
		if (requestCode == Utility.ACTIVITY_RESULT_FILECHOSEN && data != null) {
			FileActions.sendFiles(data);
		}

		// Set save location
		if (requestCode == Utility.ACTIVITY_RESULT_SAVELOCATIONCHOSEN && data != null) {
			System.out.println(data);
			Uri uri = data.getData();
			System.out.println(uri);
			traverseDirectoryEntries(uri);

			String docId = DocumentsContract.getTreeDocumentId(uri);
			Uri dirUri = DocumentsContract.buildDocumentUriUsingTree(uri, docId );

			try {
				JSONObject currentSettings = Utility.readSettings(this);
				currentSettings.put("receiveLocation", dirUri);
				Utility.writeSettings(this, currentSettings.toString());
				System.out.println(Utility.readSettings(this).toString());
			}
			catch (Exception e) {
				System.out.println("Error occurred while writing save directory location to settings.");
			}

//			OutputStream outputStream = null;
//			try {
//				byte[] bytes = new byte[100];
//				bytes[0] = 'A';
//
//				Uri newDoc = DocumentsContract.createDocument(getContentResolver(), dirUri, "text/plain", "Lynx.txt");
//				outputStream = MainActivity.mainActivityStatic.getContentResolver().openOutputStream(newDoc);
//				System.out.println(newDoc);
//				BufferedOutputStream buf = new BufferedOutputStream(outputStream);
//				buf.write(bytes);
//
//				buf.close();
//				outputStream.close();
//			} catch (Exception e) {
//				e.printStackTrace();
//			}
		}
	}

	// https://stackoverflow.com/questions/41096332/issues-traversing-through-directory-hierarchy-with-android-storage-access-framew
	// not needed, but useful function that may help later
	void traverseDirectoryEntries(Uri rootUri) {
		ContentResolver contentResolver = getContentResolver();
		Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(rootUri, DocumentsContract.getTreeDocumentId(rootUri));

		// Keep track of our directory hierarchy
		List<Uri> dirNodes = new LinkedList<>();
		dirNodes.add(childrenUri);

		while(!dirNodes.isEmpty()) {
			childrenUri = dirNodes.remove(0); // get the item from top
			System.out.println("node uri: " + childrenUri);
			Cursor c = contentResolver.query(childrenUri, new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_MIME_TYPE}, null, null, null);
			try {
				while (c.moveToNext()) {
					final String docId = c.getString(0);
					final String name = c.getString(1);
					final String mime = c.getString(2);
					System.out.println("docId: " + docId + ", name: " + name + ", mime: " + mime);
				}
			} finally {
			}
		}
	}
}
