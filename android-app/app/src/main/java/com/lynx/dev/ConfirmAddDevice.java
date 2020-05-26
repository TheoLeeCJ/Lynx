package com.lynx.dev;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.util.Log;

import androidx.fragment.app.DialogFragment;

import org.slf4j.helpers.Util;

public class ConfirmAddDevice extends DialogFragment {
	@Override
	public Dialog onCreateDialog(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());
		builder.setMessage("Are you sure you want to connect to " + getArguments().get("ipAddress") + "?")
			.setTitle("Connect to PC");

		// Add the buttons
		builder.setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				// User clicked OK button, attempt to connect
				Utility.IP_ADDR = (String) getArguments().get("ipAddress");
				Utility.IP_FAMILY = (String) getArguments().get("ipFamily");
				Utility.CONNECTION_TOKEN = (String) getArguments().get("uuid");

				String connectionUrl = "ws://";
				if (Utility.IP_FAMILY.equals("IPv4")) {
					Log.i("eeee", "4");
					connectionUrl += Utility.IP_ADDR;
				} else if (Utility.IP_FAMILY.equals("IPv6")) {
					// Wrap IP address in square brackets if it is IPv6
					connectionUrl += "[" + Utility.IP_ADDR + "]";
					Log.i("eeee", "6");
				}
				connectionUrl += ":" + Utility.WEBSOCKET_PORT;

				Utility.CONNECTION_URL = connectionUrl;
				Log.i("eeee", connectionUrl);

				Context context = getContext();
				if (context instanceof MainActivity) {
					((MainActivity) context).alterHomeMessage(Utility.HOMEMESSAGE_CONNECTING);
					((MainActivity) context).openConnection();
				}
			}
		});
		builder.setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				// User cancelled the dialog
			}
		});
		return builder.create();
	}
}
