package com.lynx.dev;

import android.util.Log;

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

	public String connectionToken;

	@Override
	public void onOpen(ServerHandshake handshakedata) {
		simpleClientStatic = this;
		try {
			JSONObject json = new JSONObject();
			json.put("type", "initial_auth");
			JSONObject messageData = new JSONObject();
			messageData.put("token", connectionToken);
			json.put("data", messageData);
			send(json.toString());
		}
		catch (Exception e) {
			System.out.println("AAAA ouch");
		}
		System.out.println("new connection opened");
	}

	public void sendText(String text) {
		send(text);
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		System.out.println("closed with exit code " + code + " additional info: " + reason);
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
		System.out.println("received ByteBuffer");
	}

	@Override
	public void onError(Exception ex) {
		System.err.println("an error occurred:" + ex);
	}
}