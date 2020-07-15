package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.graphics.PointF;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import com.dlazaro66.qrcodereaderview.QRCodeReaderView;

import org.json.JSONObject;
import org.w3c.dom.Text;

public class QRCodeScanner extends AppCompatActivity implements QRCodeReaderView.OnQRCodeReadListener {
	private TextView resultTextView;
	private QRCodeReaderView qrCodeReaderView;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.qr_code_scanner);

		qrCodeReaderView = (QRCodeReaderView) findViewById(R.id.qrdecoderview);
		qrCodeReaderView.setOnQRCodeReadListener(this);

		resultTextView = (TextView) findViewById(R.id.qrResult1);

		// Use this function to enable/disable decoding
		qrCodeReaderView.setQRDecodingEnabled(true);

		// Use this function to change the autofocus interval (default is 5 secs)
		qrCodeReaderView.setAutofocusInterval(2000L);

		// Use this function to enable/disable Torch
		qrCodeReaderView.setTorchEnabled(true);

		// Use this function to set front camera preview
		qrCodeReaderView.setFrontCamera();

		// Use this function to set back camera preview
		qrCodeReaderView.setBackCamera();
	}

	// Called when a QR is decoded
	// "text" : the text encoded in QR
	// "points" : points where QR control points are placed in View
	@Override
	public void onQRCodeRead(String text, PointF[] points) {
		resultTextView.setText(text);

		// Parse JSON
		String ipAddr = "";
		String uuid = "";
		String ipFamily = "";
		try {
			JSONObject deviceDataJSON = new JSONObject(text);

			JSONObject ipInfo = deviceDataJSON.getJSONObject("ipInfo");
			ipAddr = ipInfo.getString("address");
			ipFamily = ipInfo.getString("family");

			uuid = deviceDataJSON.getString("connectionToken");
		}
		catch (Exception e) {
			Toast.makeText(this,
				"You seem to have scanned an invalid QR code. Please try again.\n(couldn't parse QR code JSON)",
				Toast.LENGTH_LONG).show();
			return;
		}

//		Intent data = new Intent();
//		data.setData(Uri.parse(text));
//		setResult(RESULT_OK, data);
//
//		finish();
	}

	@Override
	protected void onResume() {
		super.onResume();
		qrCodeReaderView.startCamera();
	}

	@Override
	protected void onPause() {
		super.onPause();
		qrCodeReaderView.stopCamera();
	}
}
