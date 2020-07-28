package com.lynx.dev;

import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import org.json.JSONObject;


/**
 * A simple {@link Fragment} subclass.
 */
public class FirstRun4 extends Fragment {

	public FirstRun4() {
		// Required empty public constructor
	}

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container,
													 Bundle savedInstanceState) {
		// Inflate the layout for this fragment
		return inflater.inflate(R.layout.first_run4, container, false);
	}

	public void onViewCreated(View view, Bundle savedInstanceState) {
		getView().findViewById(R.id.FirstRunDone).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				JSONObject settings = Utility.readSettings(FirstRun.firstRun);
				try { settings.put("firstRun", true); }
				catch (Exception e) {}
				Utility.writeSettings(FirstRun.firstRun, settings.toString());
				FirstRun.firstRun.finish();
			}
		});
	}
}
