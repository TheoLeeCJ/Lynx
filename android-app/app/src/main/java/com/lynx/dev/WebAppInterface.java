package com.lynx.dev;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import java.net.InetSocketAddress;

import org.java_websocket.server.WebSocketServer;

import org.json.JSONObject;

public class WebAppInterface {
	Context mContext;
	WebSocketServer server = null;
	String host = null;
	WebView webView = null;

	private MainActivity mainActivity;

	/** Instantiate the interface and set the context */
	WebAppInterface(Context c, MainActivity mainActivityLocal, WebView webViewLocal) {
		mContext = c;
		mainActivity = mainActivityLocal;
		webView = webViewLocal;
	}

	/** Show a toast from the web page */
	@JavascriptInterface
	public void showToast(String toast) {
		Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
	}

	@JavascriptInterface
	public void streamTest() {
		mainActivity.startScreenCapture();
	}

	@JavascriptInterface
	public void storagePermission() {
		mainActivity.storagePermission();
	}

	@JavascriptInterface
	public void requestPermission() {
		mainActivity.requestPermission();
	}

	public void explainPrompt() {
		webView.post(new Runnable() {
			@Override
			public void run() {
				webView.loadUrl("javascript:explainPrompt();");
			}
		});
	}

	@JavascriptInterface
	public String getWifi() {
		// All the setup to get network info
		ConnectivityManager connManager = (ConnectivityManager) mContext.getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo mWifi = connManager.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
		WifiManager wifiManager = (WifiManager) mContext.getSystemService(Context.WIFI_SERVICE);
		WifiInfo info = wifiManager.getConnectionInfo();

		// Output
		JSONObject output = new JSONObject();
		try {
			output.put("on_wifi", "false");
		}
		catch (Exception e) {
			System.out.println("An unimportant exception occurred. This should not impact the operation of the app.");
		}

		// Prepare output
		try {
			if (mWifi.isConnected()) {
				output.put("on_wifi", "true");
				output.put("ip", Formatter.formatIpAddress(info.getIpAddress()));
				host = Formatter.formatIpAddress(info.getIpAddress());
			}
		}
		catch (Exception e) {
			System.out.println("An unimportant exception occurred. This should not impact the operation of the app.");
		}

		return output.toString();
	}

	@JavascriptInterface
	public void startWebsocketServer() {
		if (host == null) {
			showToast("get wifi info first please");
			return;
		}
		try {
			server = new SimpleServer(new InetSocketAddress(host, 9090), mContext);
			server.start();
			android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND);
		}
		catch (Exception e) {
			System.out.println("An unimportant exception occurred. This should not impact the operation of the app.");
		}
	}

	@JavascriptInterface
	public void setHost(String inputHost) {
		host = inputHost;
	}

	@JavascriptInterface
	public void stopWebsocketServer() {
		try {
			server.stop();
		}
		catch (Exception e) {
			System.out.println("Websocket Server closed but protested, here is the error: " + e.toString());
		}
	}
}
