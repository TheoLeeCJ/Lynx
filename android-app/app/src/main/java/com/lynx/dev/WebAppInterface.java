package com.lynx.dev;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.text.format.Formatter;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.util.Log;

import java.io.IOException;
import java.net.InetSocketAddress;

import org.java_websocket.server.WebSocketServer;

import static android.content.Context.WIFI_SERVICE;

public class WebAppInterface {
	Context mContext;
	WebSocketServer server = null;

	/** Instantiate the interface and set the context */
	WebAppInterface(Context c) {
		mContext = c;
	}

	/** Show a toast from the web page */
	@JavascriptInterface
	public void showToast(String toast) {
		Toast.makeText(mContext, toast, Toast.LENGTH_SHORT).show();
	}

	@JavascriptInterface
	public void startWebsocketServer() {
		SimpleServer.main();
		System.out.println("pressed");
	}

	@JavascriptInterface
	public void stopWebsocketServer() {

	}
}
