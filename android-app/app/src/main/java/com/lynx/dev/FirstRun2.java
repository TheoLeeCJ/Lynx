package com.lynx.dev;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import android.os.Handler;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import java.util.Map;

/**
 * A simple {@link Fragment} subclass.
 */
public class FirstRun2 extends Fragment {

	public FirstRun2() {
		// Required empty public constructor
	}

	//
	boolean hasAskedForStorage = false;
	boolean hasExplainedStorage = false;
	ActivityResultLauncher<String[]> requestPermissionLauncher = FirstRun.firstRun.registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), new ActivityResultCallback<Map<String, Boolean>>() {
		@Override
		public void onActivityResult(Map<String, Boolean> result) {
			System.out.println(result);
		}
	});
	Handler storageCheckHandler = new Handler();
	Runnable storageCheckRunnable = new Runnable() {
		@Override
		public void run() {
			if (ContextCompat.checkSelfPermission(FirstRun.firstRun, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
				getView().findViewById(R.id.StoragePermissionContinue).setVisibility(View.VISIBLE);
				getView().findViewById(R.id.StoragePermissionRequest).setVisibility(View.GONE);
				getView().findViewById(R.id.FirstRunPermissionDeniedField).setVisibility(View.GONE);
			}
			else {
				hasExplainedStorage = true;
				getView().findViewById(R.id.FirstRunPermissionDeniedField).setVisibility(View.VISIBLE);
				storageCheckHandler.postDelayed(storageCheckRunnable, 1500);
			}
		}
	};

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
		// Inflate the layout for this fragment
		return inflater.inflate(R.layout.first_run2, container, false);
	}

	public void onViewCreated(View view, Bundle savedInstanceState) {
		getView().findViewById(R.id.StoragePermissionRequest).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				requestStorage();
			}
		});

		getView().findViewById(R.id.StoragePermissionContinue).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view1) {
				FirstRun.viewPager.setCurrentItem(FirstRun.viewPager.getCurrentItem() + 1);
			}
		});
	}

	public void requestStorage() {
		System.out.println("A");
		String[] permissions = { Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE };
		storageCheckHandler.postDelayed(storageCheckRunnable, 1500);

		if (ContextCompat.checkSelfPermission(
			FirstRun.firstRun, Manifest.permission.WRITE_EXTERNAL_STORAGE) ==
			PackageManager.PERMISSION_GRANTED) {
			// You can use the API that requires the permission.
		} else if (shouldShowRequestPermissionRationale(Manifest.permission.WRITE_EXTERNAL_STORAGE)) {
			// In an educational UI, explain to the user why your app requires this
			// permission for a specific feature to behave as expected. In this UI,
			// include a "cancel" or "no thanks" button that allows the user to
			// continue using your app without granting the permission.
			if (!hasExplainedStorage) {
				hasExplainedStorage = true;
				getView().findViewById(R.id.FirstRunPermissionDeniedField).setVisibility(View.VISIBLE);
			}
			else requestPermissionLauncher.launch(permissions);
		} else {
			// You can directly ask for the permission.
			// The registered ActivityResultCallback gets the result of this request.
			if (hasAskedForStorage) getView().findViewById(R.id.FirstRunPermissionDeniedField).setVisibility(View.VISIBLE);
			else {
				hasAskedForStorage = true;
				requestPermissionLauncher.launch(permissions);
			}
		}
	}
}
