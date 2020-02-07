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
	public static WebAppInterfaceV2 webAppInterface;

	public static String ip;
	public static String connectionToken;

	public WebAppInterfaceV2 (Context c, MainActivity m, WebView w) {
		mainContext = c;
		mainActivity = m;
		webView = w;
	}

	// Android.readSettings() - passthrough to Utility.readSettings()
	@JavascriptInterface
	public String readSettings() { return Utility.readSettings(mainContext).toString(); }

	// Android.writeSettings() - passthrough to Utility.writeSettings()
	@JavascriptInterface
	public String writeSettings(String string) { return Utility.writeSettings(mainContext, string).toString(); }

	// Android.startScreenCapture() - passthrough to MainActivity.startScreenCapture()
	@JavascriptInterface
	public void startScreenCapture() { mainActivity.startScreenCapture(); }

	// Android.qrCodeReader() - passthrough to MainActivity.qrCode()
//	@JavascriptInterface
//	public void qrCodeReader() { mainActivity.qrCode(); }

	// Android.startWSClient()
	@JavascriptInterface
	public String startWSClient(String ip_local, String token) {
		try {
			webAppInterface = this;
			ip = ip_local;
			connectionToken = token;
			mainActivity.startBackgroundService(new View(mainContext));

			return "OK, Successfully connected to " + ip_local;
		}
		catch (Exception e) {
			return "Could not connect to " + ip_local + ", error is " + e.toString();
		}
	}

	// Android.sendWSText()
	@JavascriptInterface
	public String sendWSText(String message) {
		BackgroundService.client.sendText(message);
		return "Sent " + message;
	}

	// Android.stopWSClient()
	@JavascriptInterface
	public String stopWSClient() {
		BackgroundService.client.close();
		return "OK, Successfully closed websocket connection.";
	}

	// Android.startScreenStream()
	@JavascriptInterface
	public void startScreenStream() {
		mainActivity.startScreenCapture();
	}

	// ===============================================================================================

	// WebAppInterfaceV2.loadJS() - execute JavaScript
	private void loadJS(final String js) {
		webView.post(new Runnable() {
			@Override
			public void run() { webView.loadUrl("javascript:" + js); }
		});
	}

	// WebAppInterfaceV2.qrCodeResult() - pass the QR code scan result to the webpage
	public void qrCodeResult(String data) {
		loadJS("qrCodeResult('" + data.replace("'", "\\'") + "');");
	}

	// WebAppInterfaceV2.htmlLog() - log to webpage
	public void htmlLog(final String logText) {
		webView.post(new Runnable() {
			@Override
			public void run() {
				webView.loadUrl("javascript:htmlLog('" + logText + "');");
			}
		});
	}

	// ===============================================================================================

	@JavascriptInterface
	public String connectWS(String host) {
		try {
			client = new SimpleClient(new URI(host));
//			client.webAppInterface = this;
			client.connect();
			android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
			return "OK, Successfully connected to " + host;
		}
		catch (Exception e) {
			return "Could not connect to " + host + ", error is " + e.toString();
		}
	}

	public void updateDisplayedIP(final String json) {
		webView.post(new Runnable() {
			@Override
			public void run() {
				webView.loadUrl("javascript:updateIP('" + json + "');");
			}
		});
	}

	@JavascriptInterface
	public String sendWS(String text) {
		client.sendText(text);
		return "Sent " + text;
	}

	@JavascriptInterface
	public void accessibilityServiceTest() {
		BackgroundService.command = "home";
	}

	@JavascriptInterface
	public void explainPrompt() { }

	@JavascriptInterface
	public void stopWebsocketServer() { }
}
