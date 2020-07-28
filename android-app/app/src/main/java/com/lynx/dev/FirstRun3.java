package com.lynx.dev;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.fragment.app.Fragment;

import android.provider.DocumentsContract;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import org.json.JSONObject;


/**
 * A simple {@link Fragment} subclass.
 */
public class FirstRun3 extends Fragment {

	public FirstRun3() {
		// Required empty public constructor
	}


	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
		// Inflate the layout for this fragment
		return inflater.inflate(R.layout.first_run3, container, false);
	}

	public void onViewCreated(View view, Bundle savedInstanceState) {
		getView().findViewById(R.id.FolderRequest).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view1) {
				Intent chooseFolder;
				chooseFolder = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
				startActivityForResult(chooseFolder, Utility.ACTIVITY_RESULT_SAVELOCATIONCHOSEN);
			}
		});

		getView().findViewById(R.id.FolderContinue).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View view1) {
				FirstRun.viewPager.setCurrentItem(FirstRun.viewPager.getCurrentItem() + 1);
			}
		});
	}

	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		switch (requestCode) {
			case Utility.ACTIVITY_RESULT_SAVELOCATIONCHOSEN:
				Uri uri;
				try {
					uri = data.getData();
				}
				catch (Exception e) {
					getView().findViewById(R.id.FirstRunFolderError).setVisibility(View.VISIBLE);
					return;
				}

				getView().findViewById(R.id.FirstRunFolderError).setVisibility(View.GONE);

				String docId = DocumentsContract.getTreeDocumentId(uri);
				Uri dirUri = DocumentsContract.buildDocumentUriUsingTree(uri, docId);

				try {
					JSONObject currentSettings = Utility.readSettings(FirstRun.firstRun);
					currentSettings.put("receiveLocation", dirUri);
					Utility.writeSettings(FirstRun.firstRun, currentSettings.toString());
					System.out.println(Utility.readSettings(FirstRun.firstRun).toString());
				}
				catch (Exception e) {
					System.out.println("Error occurred while writing save directory location to settings.");
					return;
				}

				getView().findViewById(R.id.FolderRequest).setVisibility(View.GONE);
				getView().findViewById(R.id.FolderContinue).setVisibility(View.VISIBLE);
				break;
			default:
				break;
		}
	}
}
