package com.lynx.dev;

import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;


/**
 * A simple {@link Fragment} subclass.
 */
public class FirstRun1Ext extends Fragment {

	public FirstRun1Ext() {
		// Required empty public constructor
	}


	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container,
													 Bundle savedInstanceState) {
		// Inflate the layout for this fragment
		return inflater.inflate(R.layout.first_run1_ext, container, false);
	}

	public void onViewCreated(View view, Bundle savedInstanceState) {
		getView().findViewById(R.id.FirstRun1StartExt).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view1) {
				FirstRun.viewPager.setCurrentItem(FirstRun.viewPager.getCurrentItem() + 1);
			}
		});
	}
}
