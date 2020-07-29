package com.lynx.dev;

import android.Manifest;
import android.content.pm.PackageManager;
import android.opengl.Visibility;
import android.os.Bundle;
import android.view.View;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import org.json.JSONObject;

import java.util.Map;

public class FirstRun extends FragmentActivity {
	/**
	 * The number of pages (wizard steps) to show in this demo.
	 */
	private static final int NUM_PAGES = 5;

	/**
	 * The pager widget, which handles animation and allows swiping horizontally to access previous
	 * and next wizard steps.
	 */
	public static ViewPager2 viewPager;

	/**
	 * The pager adapter, which provides the pages to the view pager widget.
	 */
	private FragmentStateAdapter pagerAdapter;
	public static FirstRun firstRun;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		firstRun = this;

		super.onCreate(savedInstanceState);
		setContentView(R.layout.first_run);

		// Instantiate a ViewPager2 and a PagerAdapter.
		viewPager = findViewById(R.id.pager);
		pagerAdapter = new ScreenSlidePagerAdapter(this);
		viewPager.setAdapter(pagerAdapter);

		viewPager.setUserInputEnabled(false);
	}

	@Override
	public void onBackPressed() {
		if (viewPager.getCurrentItem() == 0) {
			// If the user is currently looking at the first step, allow the system to handle the
			// Back button. This calls finish() on this activity and pops the back stack.
//			super.onBackPressed();
			moveTaskToBack(true);
		} else {
			// Otherwise, select the previous step.
			viewPager.setCurrentItem(viewPager.getCurrentItem() - 1);
		}
	}

	/**
	 * A simple pager adapter that represents 5 ScreenSlidePageFragment objects, in
	 * sequence.
	 */
	private class ScreenSlidePagerAdapter extends FragmentStateAdapter {
		public ScreenSlidePagerAdapter(FragmentActivity fa) {
			super(fa);
		}

		@Override
		public Fragment createFragment(int position) {
			switch (position) {
				case 0:
					return new FirstRun1();
				case 1:
					return new FirstRun1Ext();
				case 2:
					return new FirstRun2();
				case 3:
					return new FirstRun3();
				case 4:
					return new FirstRun4();
				default:
					return new FirstRun4();
			}
		}

		@Override
		public int getItemCount() {
			return NUM_PAGES;
		}
	}
}
