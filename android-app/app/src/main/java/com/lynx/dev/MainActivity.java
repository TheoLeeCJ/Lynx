package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.app.Activity;

public class MainActivity extends AppCompatActivity {
	public WebView webapp = null;

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
		webapp.loadUrl("http://192.168.1.241:3000/");
	}

	@Override
	public void onBackPressed() {
		if (webapp.canGoBack()) {
			webapp.goBack();
		} else {
			super.onBackPressed();
		}
	}

	public void reloadPage(View view) {
		webapp.loadUrl("http://192.168.1.241:3000/");
	}
}
