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
		// Are you sure you want to connect to (IP Address)?
		// MAKE SURE THIS IS A PC YOU CAN TRUST. (bold and italic)
		builder.setMessage("Are you sure you want to connect to " + getArguments().get("ipAddress") + "?\n\uD835\uDE48\uD835\uDE56\uD835\uDE60\uD835\uDE5A \uD835\uDE68\uD835\uDE6A\uD835\uDE67\uD835\uDE5A \uD835\uDE69\uD835\uDE5D\uD835\uDE5E\uD835\uDE68 \uD835\uDE5E\uD835\uDE68 \uD835\uDE56 \uD835\uDE4B\uD835\uDE3E \uD835\uDE6E\uD835\uDE64\uD835\uDE6A \uD835\uDE58\uD835\uDE56\uD835\uDE63 \uD835\uDE69\uD835\uDE67\uD835\uDE6A\uD835\uDE68\uD835\uDE69.")
			.setTitle("Connect to PC");

		// Add the buttons
		builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				// User clicked OK button, attempt to connect
				Utility.IP_ADDR = (String) getArguments().get("ipAddress");
				Utility.IP_FAMILY = (String) getArguments().get("ipFamily");
				Utility.CONNECTION_TOKEN = (String) getArguments().get("uuid");

				String connectionUrl = "ws://";
//				String connectionUrl = "wss://";
				if (Utility.IP_FAMILY.equals("IPv4")) {
					connectionUrl += Utility.IP_ADDR;
				} else if (Utility.IP_FAMILY.equals("IPv6")) {
					// Wrap IP address in square brackets if it is IPv6
					connectionUrl += "[" + Utility.IP_ADDR + "]";
				}
				connectionUrl += ":" + Utility.WEBSOCKET_PORT;

				Utility.CONNECTION_URL = connectionUrl;

				Context context = getContext();
				if (context instanceof MainActivity) {
					((MainActivity) context).alterHomeMessage(Utility.HOMEMESSAGE_CONNECTING);
					((MainActivity) context).openConnection();
				}
			}
		});
		builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int id) {
				// User cancelled the dialog
			}
		});
		return builder.create();
	}
}
