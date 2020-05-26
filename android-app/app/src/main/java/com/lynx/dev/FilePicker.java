package com.lynx.dev;

import android.Manifest;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Environment;

import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.DialogFragment;

import java.io.File;
import java.io.FilenameFilter;

public class FilePicker extends DialogFragment {
	//In an Activity
	private String[] mFileList;
	private File mPath = new File(Environment.getExternalStorageDirectory().toString());
	private String mChosenFile;
	private static final String FTYPE = "";
	private static final int DIALOG_LOAD_FILE = 1000;

	public void loadFileList() {
		try {
			mPath.mkdirs();
		}
		catch(SecurityException e) {
//			Log.e(TAG, "unable to write on the sd card " + e.toString());
		}
		if(mPath.exists()) {
			FilenameFilter filter = new FilenameFilter() {
				@Override
				public boolean accept(File dir, String filename) {
					File sel = new File(dir, filename);
					return sel.isDirectory();
				}
			};

			mFileList = mPath.list(filter);
		}
		else {
			System.out.println("a");
			mFileList= new String[0];
		}
	}

	@Override
	public Dialog onCreateDialog(Bundle savedInstanceState) {
		Dialog dialog = null;
		AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());

		loadFileList();
		System.out.println(mFileList);
		System.out.println(mPath);

		builder.setTitle("Choose Folders");
		if(mFileList == null) {
			dialog = builder.create();
			return dialog;
		}
		builder.setItems(mFileList, new DialogInterface.OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				mChosenFile = mFileList[which];
				//you can do stuff with the file here too
			}
		});

		dialog = builder.show();
		return dialog;
	}
}
