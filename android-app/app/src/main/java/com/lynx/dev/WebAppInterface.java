package com.lynx.dev;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.util.Log;

import java.io.IOException;

import fi.iki.elonen.NanoWSD;

public class WebAppInterface {
	Context mContext;
	NanoWSD ws = null;

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
		ws = new DebugWebSocketServer(9090, true);
		try {
			ws.start();
		}
		catch (Exception e) {
			Log.d("JAAVAAAAAA", e.toString());
		}
		System.out.println("Server started, hit Enter to stop.\n");
	}

	@JavascriptInterface
	public void stopWebsocketServer() {
		ws.stop();
		System.out.println("Server stopped.\n");
	}
}
