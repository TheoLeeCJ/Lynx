package com.lynx.dev;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Map;

public class FileActions {
	public static ArrayList<Uri> files;
	public static ArrayList<String> filesInPathForm;
	public static Boolean transferOpen = false;
	public static Map<String, String> receiveState;
	public static BufferedOutputStream currentFileBuffer;
	public static OutputStream currentFileOutputStream;

	public static Notification largeFileProgressNotif;
	public static int numberOfChunksPending;
	public static int numberOfChunksReceived;

	public static boolean sendWasRequestedFromDriveMapping = false;
	public static String fileID = null;

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

				if (numberOfChunksPending != 0) {
					numberOfChunksReceived += 1;

					NotificationCompat.Builder builder = new NotificationCompat.Builder(BackgroundService.backgroundServiceStatic, "file_receive_progress")
						.setSmallIcon(R.mipmap.lynx_raw)
						.setContentTitle("Receiving File(s) from PC")
						.setProgress(numberOfChunksPending, numberOfChunksReceived, false)
						.setPriority(NotificationCompat.PRIORITY_LOW);

					((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).notify(32, builder.build());
				}
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

				((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(32);
			}
			catch (Exception e) {
				System.out.println(e);
			}
		}

		// open new file
		receiveState = newReceiveState;

		// show progress if it's a large file
		int size = Integer.parseInt(receiveState.get("fileSize"));
		numberOfChunksPending = 0;

		if (size > Utility.FILETRANSFER_SEND_CHUNK_SIZE) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
				BackgroundService.backgroundServiceStatic.createNotificationChannel("file_receive_progress", "File Receive Progress", NotificationManager.IMPORTANCE_LOW);
			}

			numberOfChunksPending = (int) size / Utility.FILETRANSFER_SEND_CHUNK_SIZE;
			System.out.println(numberOfChunksPending + " chunks expected");

			NotificationCompat.Builder builder = new NotificationCompat.Builder(BackgroundService.backgroundServiceStatic, "file_send_progress")
				.setSmallIcon(R.mipmap.lynx_raw)
				.setContentTitle("Receiving File(s) from PC")
				.setProgress(numberOfChunksPending, 0, false)
				.setPriority(NotificationCompat.PRIORITY_LOW);

			((NotificationManager) BackgroundService.backgroundServiceStatic.getSystemService(Context.NOTIFICATION_SERVICE)).notify(32, builder.build());
		}
	}

	public static void beginBatch() {
		for (int i = 0; i < files.size(); i++) {
			Uri uri = files.get(i);
			String filename;

			long size = 0;

			if (!sendWasRequestedFromDriveMapping) { // use Storage Access Framework
				Cursor returnCursor =
					MainActivity.mainActivityStatic.getContentResolver().query(uri, null, null, null, null);
				int sizeIndex = returnCursor.getColumnIndex(OpenableColumns.SIZE);
				returnCursor.moveToFirst();
				size = returnCursor.getLong(sizeIndex);
				filename = getFileName(uri);
			}
			else { // use File APIs
				size = new File(filesInPathForm.get(i)).length();
				filename = filesInPathForm.get(i);
			}

			byte[] bytes = new byte[Utility.FILETRANSFER_SEND_CHUNK_SIZE];

			// indicate to PC to start file transfer
			JSONObject transferStart = new JSONObject();

			try {
				transferStart.put("type", "filetransfer_file_start");
				JSONObject messageData = new JSONObject();
				messageData.put("fileIndex", i);
				messageData.put("filename", filename);
				messageData.put("fileSize", size);
				if (fileID != null) messageData.put("fileID", fileID);
				transferStart.put("data", messageData);
			}
			catch (JSONException e) {
				Toast.makeText(MainActivity.mainActivityStatic, "Error in generating JSON object; this should never happen.", Toast.LENGTH_SHORT);
				return;
			}
			SimpleClient.simpleClientStatic.sendText(transferStart.toString());

			// actually read file and start sending data
			try {
				InputStream inputStream;

				if (!sendWasRequestedFromDriveMapping) { // use Storage Access Framework
					inputStream = MainActivity.mainActivityStatic.getContentResolver().openInputStream(uri);
				}
				else { // use File APIs
					inputStream = new FileInputStream(filename);
				}

				BufferedInputStream buf = new BufferedInputStream(inputStream);

				long bytesSent = 0;

				// chunking
				while (size > bytesSent) {
					if ((size - (bytesSent + Utility.FILETRANSFER_SEND_CHUNK_SIZE)) > 0) {
						System.out.println("A chunk");
						buf.read(bytes, 0, Utility.FILETRANSFER_SEND_CHUNK_SIZE);
						bytesSent += Utility.FILETRANSFER_SEND_CHUNK_SIZE;
					}
					else {
						System.out.println(size - bytesSent);
						bytes = new byte[(int) (size - bytesSent)];
						System.out.println("Near end of file / small file");
						buf.read(bytes, 0, (int) (size - bytesSent));
						bytesSent += Utility.FILETRANSFER_SEND_CHUNK_SIZE;
					}

					try {
						if (fileID != null) {
							byte[] specialBytes = fileID.getBytes(StandardCharsets.UTF_8);
							System.out.println(specialBytes.length);
							byte[] bytesToSend = new byte[bytes.length + specialBytes.length];
							System.arraycopy(specialBytes, 0, bytesToSend, 0, specialBytes.length);
							System.arraycopy(bytes, 0, bytesToSend, specialBytes.length, bytes.length);
							SimpleClient.simpleClientStatic.send(bytesToSend);
						}
						else {
							SimpleClient.simpleClientStatic.send(bytes);
						}
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
					JSONObject transferEndData = new JSONObject();
					if (fileID != null) { transferEndData.put("fileID", fileID); }
					transferEnd.put("data", transferEndData);
				}
				catch (JSONException e) {
					Toast.makeText(MainActivity.mainActivityStatic, "Error in generating JSON object; this should never happen.", Toast.LENGTH_SHORT);
					return;
				}
				fileID = null;
				SimpleClient.simpleClientStatic.sendText(transferEnd.toString());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		transferOpen = false;
	}

	public static void sendFiles(Intent data, boolean ...useFileArrayDirectlyArgument) {
		boolean useFileArrayDirectly = false;
		if (useFileArrayDirectlyArgument.length == 1) useFileArrayDirectly = useFileArrayDirectlyArgument[0];
		// ^ weird hack to get around Java's lack of default arguments

		transferOpen = true;
		sendWasRequestedFromDriveMapping = false;

		if (!useFileArrayDirectly) {
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
		}

		// ask PC for permission to send these files
		JSONObject permissionRequest = new JSONObject();
		try {
			permissionRequest.put("type", "filetransfer_batch_request");
			JSONObject messageData = new JSONObject();
			JSONArray filesToSend = new JSONArray();

			for (int i = 0; i < files.size(); i++) {
				JSONObject fileInfo = new JSONObject();
				fileInfo.put("filename", getFileName(files.get(i)));

				Cursor fileCursor = BackgroundService.backgroundServiceStatic.getContentResolver()
						.query(files.get(i), null, null, null, null);
				fileCursor.moveToFirst();
				long fileSize = fileCursor.getLong(fileCursor.getColumnIndex(OpenableColumns.SIZE));
				fileCursor.close();
				fileInfo.put("fileSize", fileSize);

				filesToSend.put(fileInfo);
			}

			messageData.put("files", filesToSend);
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
