package com.lynx.dev;

import android.content.ClipData;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Map;

public class FileActions {
	public static ArrayList<Uri> files;
	public static Boolean transferOpen = false;
	public static Map<String, String> receiveState;
	public static BufferedOutputStream currentFileBuffer;
	public static OutputStream currentFileOutputStream;

	public static void receiveBinaryFileChunk(ByteBuffer fileChunk) {
		if ((receiveState == null) || (!transferOpen)) return;

		if (currentFileBuffer == null) {
			System.out.println("Open new file.");
			String filename = receiveState.get("filename");
			Uri dirUri;

			System.out.println(fileChunk.remaining());

			byte[] bytes = new byte[fileChunk.remaining()];
			fileChunk.get(bytes);

			System.out.println(fileChunk.remaining());

			try {
				JSONObject currentSettings = Utility.readSettings(BackgroundService.backgroundServiceStatic);
				dirUri = Uri.parse(currentSettings.getString("receiveLocation"));

				Uri newDoc = DocumentsContract.createDocument(BackgroundService.backgroundServiceStatic.getContentResolver(), dirUri, receiveState.get("mimeType"), filename);
				currentFileOutputStream = MainActivity.mainActivityStatic.getContentResolver().openOutputStream(newDoc);
				System.out.println(newDoc);
				currentFileBuffer = new BufferedOutputStream(currentFileOutputStream);
				System.out.println("writing bytes");
				currentFileBuffer.write(bytes);
			}
			catch (Exception e) {
				System.out.println(e);
			}
		}
		else {
			byte[] bytes = new byte[fileChunk.remaining()];
			fileChunk.get(bytes);

			try {
				currentFileBuffer.write(bytes);
			}
			catch (Exception e) {
				System.out.println(e);
			}
		}
	}

	public static void setFileReceiveState(Map<String, String> newReceiveState) {
		// write to file
		if (newReceiveState == null) {
			try {
				System.out.println("close");
				currentFileBuffer.close();
				currentFileOutputStream.close();
				currentFileBuffer = null;
				currentFileOutputStream = null;
			}
			catch (Exception e) {
				System.out.println(e);
			}
		}

		// open new file
		receiveState = newReceiveState;
	}

	public static void beginBatch() {
		for (int i = 0; i < files.size(); i++) {
			Uri uri = files.get(i);
			String fileName = getFileName(uri);
			System.out.println(fileName);

			Cursor returnCursor =
				MainActivity.mainActivityStatic.getContentResolver().query(uri, null, null, null, null);
			int sizeIndex = returnCursor.getColumnIndex(OpenableColumns.SIZE);
			returnCursor.moveToFirst();
			int size = (int) returnCursor.getLong(sizeIndex);

			byte[] bytes = new byte[Utility.FILETRANSFER_SEND_CHUNK_SIZE];

			// indicate to PC to start file transfer
			JSONObject transferStart = new JSONObject();
			try {
				transferStart.put("type", "filetransfer_file_start");
				JSONObject messageData = new JSONObject();
				messageData.put("fileIndex", i);
				messageData.put("filename", getFileName(uri));
				messageData.put("fileSize", size);
				transferStart.put("data", messageData);
			}
			catch (JSONException e) {
				Toast.makeText(MainActivity.mainActivityStatic, "Error in generating JSON object; this should never happen.", Toast.LENGTH_SHORT);
				return;
			}
			SimpleClient.simpleClientStatic.sendText(transferStart.toString());

			// actually read file and start sending data
			try {
				InputStream inputStream = MainActivity.mainActivityStatic.getContentResolver().openInputStream(uri);
				BufferedInputStream buf = new BufferedInputStream(inputStream);

				int bytesSent = 0;

				// chunking
				while (size > bytesSent) {
					if ((size - (bytesSent + Utility.FILETRANSFER_SEND_CHUNK_SIZE)) > 0) {
						System.out.println("A chunk");
						buf.read(bytes, 0, Utility.FILETRANSFER_SEND_CHUNK_SIZE);
						bytesSent += Utility.FILETRANSFER_SEND_CHUNK_SIZE;
					}
					else {
						System.out.println(size - bytesSent);
						bytes = new byte[size - bytesSent];
						System.out.println("Near end of file / small file");
						buf.read(bytes, 0, size - bytesSent);
						bytesSent += Utility.FILETRANSFER_SEND_CHUNK_SIZE;
					}

					try {
						SimpleClient.simpleClientStatic.send(bytes);
					}
					catch (Exception e) {
						System.out.println(e.toString());
						Toast.makeText(MainActivity.mainActivityStatic, "Not connected to any PCs, or an error has occurred.", Toast.LENGTH_SHORT).show();
					}
				}

				buf.close();
				inputStream.close();

				// indicate to PC to end file transfer
				JSONObject transferEnd = new JSONObject();
				try {
					transferEnd.put("type", "filetransfer_file_end");
				}
				catch (JSONException e) {
					Toast.makeText(MainActivity.mainActivityStatic, "Error in generating JSON object; this should never happen.", Toast.LENGTH_SHORT);
					return;
				}
				SimpleClient.simpleClientStatic.sendText(transferEnd.toString());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		transferOpen = false;
	}

	public static void sendFiles(Intent data) {
		transferOpen = true;
		System.out.println("OI");

		Uri singleFile = data.getData();
		ClipData multiFile = data.getClipData();
		files = new ArrayList<Uri>();

		// process Intent data into an array of Uris, regardless of whether a single file or multiple files were chosen
		if (multiFile != null) {
			for (int i = 0; i < multiFile.getItemCount(); i++) {
				System.out.println(multiFile.getItemAt(i).getUri());
				files.add(multiFile.getItemAt(i).getUri());
			}
		}
		else {
			System.out.println(singleFile);
			files.add(singleFile);
		}

		// ask PC for permission to send these files
		JSONObject permissionRequest = new JSONObject();
		try {
			permissionRequest.put("type", "filetransfer_batch_request");
			JSONObject messageData = new JSONObject();
			JSONArray filenames = new JSONArray();

			for (int i = 0; i < files.size(); i++) {
				filenames.put(getFileName(files.get(i)));
			}

			messageData.put("filenames", filenames);
			permissionRequest.put("data", messageData);
		}
		catch (JSONException e) {
			Toast.makeText(MainActivity.mainActivityStatic, "Error in generating JSON object; this should never happen.", Toast.LENGTH_SHORT);
			return;
		}

		try {
			SimpleClient.simpleClientStatic.sendText(permissionRequest.toString());
		}
		catch (Exception e) {
			Toast.makeText(MainActivity.mainActivityStatic, "Not connected to any PCs, or an error has occurred.", Toast.LENGTH_SHORT).show();
		}
	}

	// thanks, https://stackoverflow.com/questions/5568874/how-to-extract-the-file-name-from-uri-returned-from-intent-action-get-content!
	public static String getFileName(Uri uri) {
		String result = null;
		if (uri.getScheme().equals("content")) {
			Cursor cursor = MainActivity.mainActivityStatic.getContentResolver().query(uri, null, null, null, null);
			try {
				if (cursor != null && cursor.moveToFirst()) {
					result = cursor.getString(cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME));
				}
			} finally {
				cursor.close();
			}
		}
		if (result == null) {
			result = uri.getPath();
			int cut = result.lastIndexOf('/');
			if (cut != -1) {
				result = result.substring(cut + 1);
			}
		}
		return result;
	}
}
