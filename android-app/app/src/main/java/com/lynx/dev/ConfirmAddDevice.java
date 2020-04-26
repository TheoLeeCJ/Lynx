package com.lynx.dev;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.os.Bundle;
import android.util.Log;

import androidx.fragment.app.DialogFragment;

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
				Utility.CONNECTION_TOKEN = (String) getArguments().get("uuid");

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
