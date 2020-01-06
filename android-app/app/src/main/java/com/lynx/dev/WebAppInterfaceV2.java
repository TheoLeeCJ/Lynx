package com.lynx.dev;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import java.net.InetSocketAddress;
import java.net.URI;

import org.java_websocket.client.WebSocketClient;

import org.json.JSONObject;

public class WebAppInterfaceV2 {
	Context mainContext;
	MainActivity mainActivity;
	WebView webView;
	SimpleClient client;

	public WebAppInterfaceV2 (Context c, MainActivity m, WebView w) {
		mainContext = c;
		mainActivity = m;
		webView = w;
	}

	@JavascriptInterface
	public String connectWS(String host) {
		try {
			client = new SimpleClient(new URI(host));
			client.connect();
			android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
			return "Successfully connected to " + host;
		}
		catch (Exception e) {
			return "Could not connect to " + host + ", error is " + e.toString();
		}
	}

	@JavascriptInterface
	public String sendWS(String text) {
		client.sendText(text);
		return "Sent " + text;
	}

	@JavascriptInterface
	public String qrCodeReader() {
		mainActivity.qrCode();
		return "Started QR Code Reader Activity";
	}

	@JavascriptInterface
	public String startBackgroundService() {
		return "A";
	}

	@JavascriptInterface
	public void explainPrompt() { }

	@JavascriptInterface
	public void stopWebsocketServer() { }
}
