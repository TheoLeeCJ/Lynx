package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.webkit.WebView;
import android.content.res.AssetManager;

public class MainActivity extends AppCompatActivity {
	public WebView webapp = null;
	public AssetManager assetManager = null;

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

		// Load content into webview
		webapp.loadUrl("http://192.168.1.241:3000/");

		// Bind WebAppInterface to the webview
		webapp.addJavascriptInterface(new WebAppInterface(this), "Android");
	}

	@Override
	public void onBackPressed() {
		if (webapp.canGoBack()) {
			webapp.goBack();
		} else {
			super.onBackPressed();
		}
	}
}
