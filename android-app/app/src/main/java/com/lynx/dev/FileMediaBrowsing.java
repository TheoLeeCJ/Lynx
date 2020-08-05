package com.lynx.dev;

import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Size;

import androidx.annotation.RequiresApi;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;

public class FileMediaBrowsing {
	public static ArrayList<Bitmap> thumbnails = new ArrayList<>();
	public static ArrayList<String> files = new ArrayList<>();

	public static void sendDirectory(String path, int resourceIndex) {
		// Prevent /../../../ attacks
		if (path.contains("..")) return;

		// ...
		System.out.println(Environment.getExternalStorageDirectory().toString());
		JSONArray directoryListing = new JSONArray();
		File folder = new File(Environment.getExternalStorageDirectory().toString() + path); // just get a folder with a ton of files; I'm testing performance!
		File[] filesInFolder = folder.listFiles();

		// Object Name, Object Type (File / Folder), Last Modified
		for (File file : filesInFolder) {
			if (!file.isDirectory()) {
				JSONArray processedFile = new JSONArray();
				processedFile.put(file.getName());
				processedFile.put("file");
				processedFile.put(file.lastModified());
				directoryListing.put(processedFile);
			}
			else {
				JSONArray processedFile = new JSONArray();
				processedFile.put(file.getName());
				processedFile.put("folder");
				processedFile.put(file.lastModified());
				directoryListing.put(processedFile);
			}
		}

		// Generate and send message
		try {
			JSONObject message = new JSONObject();
			message.put("type", "filetransfer_drive_list_dir_reply");
			message.put("data", directoryListing);
			message.put("path", path);
			message.put("resourceIndex", resourceIndex);
			SimpleClient.simpleClientStatic.sendText(message.toString());
		}
		catch (Exception e) {

		}
	}

	public static void mediastoreImageTest() {
		String[] projection = new String[] {
			MediaStore.Images.Media._ID,
			MediaStore.Images.Media.DISPLAY_NAME,
			MediaStore.Images.Media.DATE_ADDED,
			MediaStore.Images.Media.BUCKET_ID, // claims to be available only in Android 9 and above, but I tested and found it to work in Android 7.
			MediaStore.Images.Media.BUCKET_DISPLAY_NAME
		};
		String selection = MediaStore.Images.Media.DATE_ADDED + " >= ?";
		String[] selectionArgs = new String[] {
			String.valueOf(1596240000)
		};
		String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

		try (Cursor cursor = MainActivity.mainActivityStatic.getContentResolver().query(
			MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
			projection,
			selection,
			selectionArgs,
			sortOrder
		)) {
			// Cache column indices.
			int idColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
			int nameColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
			int addedColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);
			int bucketNameColumn = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);

			while (cursor.moveToNext()) {
				// Get values of columns for a given Images.
				long id = cursor.getLong(idColumn);
				String name = cursor.getString(nameColumn);
				int added = cursor.getInt(addedColumn);

				Uri contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);
				System.out.println("Source of image: " + cursor.getString(bucketNameColumn));

				// "Deprecated" way of generating thumbnails. But it performs better than the "new" way! As with many things in life.
				thumbnails.add(MediaStore.Images.Thumbnails.getThumbnail(MainActivity.mainActivityStatic.getContentResolver(), id, MediaStore.Images.Thumbnails.MINI_KIND, null));

				// New, post-Android 9 way of generating thumbnails (slower)
//				if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//					try {
//						Bitmap thumbnail = MainActivity.mainActivityStatic.getContentResolver().loadThumbnail(contentUri, new Size(360, 360), null);
//						thumbnails.add(thumbnail);
//						System.out.println("Image found " + thumbnails.size());
//					}
//					catch (Exception e) {
//						e.printStackTrace();
//					}
//				}
			}
		}
	}

	public static void fileBrowsingTest() {
		File folder = new File("/sdcard/WhatsApp/Media/WhatsApp Images"); // just get a folder with a ton of files; I'm testing performance!
		File[] filesInFolder = folder.listFiles();

		for (File file : filesInFolder) {
			if (!file.isDirectory()) {
				files.add(file.getName());
			}
		}

		System.out.println(files.size() + " files found in /sdcard/WhatsApp/Media/WhatsApp Images");
	}

	public static void whatever() {
//		mediastoreImageTest();
		fileBrowsingTest();
	}
}
