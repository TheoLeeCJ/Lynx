package com.lynx.dev;

import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.os.Handler;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

/**
 * A simple {@link Fragment} subclass.
 */
public class FirstRun1 extends Fragment {

	public FirstRun1() {
		// Required empty public constructor
	}

	Handler animateLogo = new Handler();
	public Runnable animateLogoRunnable = new Runnable() {
		@Override
		public void run() {
			getView().findViewById(R.id.FirstRunLynxLogoAnim).setVisibility(View.VISIBLE);
		}
	};

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
		// Inflate the layout for this fragment
		return inflater.inflate(R.layout.first_run1, container, false);
	}

	public void onViewCreated(View view, Bundle savedInstanceState) {
		getView().findViewById(R.id.FirstRunLynxLogoAnim).setVisibility(View.GONE);
		animateLogo.postDelayed(animateLogoRunnable, 50);

		getView().findViewById(R.id.FirstRun1Start).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view1) {
				FirstRun.viewPager.setCurrentItem(FirstRun.viewPager.getCurrentItem() + 1);
			}
		});
	}
}
