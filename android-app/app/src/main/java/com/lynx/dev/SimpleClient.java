package com.lynx.dev;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Display;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.net.URI;
import java.nio.ByteBuffer;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONException;
import org.json.JSONObject;

public class SimpleClient extends WebSocketClient {
	static SimpleClient simpleClientStatic;
	public SimpleClient(URI serverURI) {
		super(serverURI);
	}
	public boolean pingPong = false;

	public String connectionToken;

	@Override
	public void onOpen(ServerHandshake handshakeData) {
		simpleClientStatic = this;
		try {
			JSONObject json = new JSONObject();
			json.put("type", "initial_auth");
			JSONObject messageData = new JSONObject();
			messageData.put("token", connectionToken);
			messageData.put("identification", Build.MANUFACTURER + " " + Build.MODEL);
			json.put("data", messageData);
			send(json.toString());
		}
		catch (Exception e) {
			System.out.println("AAAA ouch");
		}
		System.out.println("new connection opened");
		pingPong = true;
		setConnectionLostTimeout(0);
//		pingPongHandler.postDelayed(performPing, 5000);
	}

	public void sendText(String text) {
		send(text);
	}

	public void sendStopImage(Bitmap a) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();

		a.compress(Bitmap.CompressFormat.JPEG, 40, baos);
		byte[] imageBytes = baos.toByteArray();

		String base64screen = Base64.encodeToString(imageBytes, Base64.DEFAULT);

		try {
			JSONObject message = new JSONObject();
			message.put("type", "screenstream_frame");
			JSONObject data = new JSONObject();
			data.put("frame", base64screen);
			message.put("data", data);
			sendText(message.toString());
		}
		catch (Exception e) {

		}
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		System.out.println("closed with exit code " + code + " additional info: " + reason);

		// reset variables
		BackgroundService.mResultCode = 5000;
		BackgroundService.mResultData = null;

		// (try) and update mainactivity
		if (MainActivity.mainActivityStatic != null) {
			MainActivity.mainActivityStatic.alterHomeMessage(Utility.HOMEMESSAGE_NOT_CONNECTED);
		}

		BackgroundService.fixAppliedInSession = false;

		// update notification
		BackgroundService.backgroundServiceStatic.tearDownVirtualDisplay();
		BackgroundService.backgroundServiceStatic.stopSelf();
	}

	@Override
	public void onMessage(String message) {
		System.out.println("received message: " + message);
		try {
			MessageHandler.handleMessage(new JSONObject(message));
		} catch (JSONException e) {
			Log.e("JSONObject constructor", "JSON parse exception occurred", e);
		}
	}

	@Override
	public void onMessage(ByteBuffer message) {
		System.out.println("received ByteBuffer" + message.remaining());
		FileActions.receiveBinaryFileChunk(message);
	}

	// INACTIVE CODE (but don't remove)
	Handler pingPongHandler = new Handler();

	private Runnable performPing = new Runnable(){
		public void run(){
			if (pingPong) {
				sendPing();
				System.out.println("pinging websocket server");
			}

			pingPongHandler.postDelayed(performPing,5000);
		}
	};
	// END INACTIVE CODE

	@Override
	public void onError(Exception ex) {
		System.err.println("an error occurred:" + ex);
	}
}