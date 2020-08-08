package com.lynx.dev;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.Buffer;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class Utility {
	// Constants
	public static int PERMISSION_STORAGE = 4096;
	public static int PERMISSION_SCREENCAST = 4097;
	public static int PERMISSION_DISPLAYOVEROTHERAPPS = 4098;
	public static int MISAKA_MIKOTO = 4099;

	public static final int ACTIVITY_RESULT_QRCODE = 5001;
	public static final int ACTIVITY_RESULT_FILECHOSEN = 5002;
	public static final int ACTIVITY_RESULT_SAVELOCATIONCHOSEN = 5003;

	public static int HOMEMESSAGE_CONNECTING = 6001;
	public static int HOMEMESSAGE_CONNECTED = 6002;
	public static int HOMEMESSAGE_NOT_CONNECTED = 6003;

	public static int FILETRANSFER_SEND_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

	public static int WEBSOCKET_PORT = 57531;
//	public static int WEBSOCKET_PORT = 443;

	// Data-passing
	public static String IP_ADDR = "";
	public static String IP_FAMILY = "";
	public static String CONNECTION_TOKEN = "";
	public static String CONNECTION_URL = "";

	public static JSONObject readSettings(Context context) {
		FileInputStream fis;
		String contents;

		try { fis = context.openFileInput("config.json"); }
		catch (FileNotFoundException e) { return new JSONObject(); }

		InputStreamReader inputStreamReader = new InputStreamReader(fis, StandardCharsets.UTF_8);
		StringBuilder stringBuilder = new StringBuilder();

		try (BufferedReader reader = new BufferedReader(inputStreamReader)) {
			String line = reader.readLine();
			while (line != null) {
				stringBuilder.append(line).append('\n');
				line = reader.readLine();
			}
		} catch (IOException e) {
			// Error occurred when opening raw file for reading.
		} finally {
			contents = stringBuilder.toString();
		}

		try { return new JSONObject(contents); }
		catch (JSONException e) { return new JSONObject(); }
	}

	public static Boolean writeSettings(Context context, String settings) {
		try (FileOutputStream fos = context.openFileOutput("config.json", Context.MODE_PRIVATE)) {
			fos.write(settings.getBytes());
			return true;
		}
		catch (Exception e) {
			return false;
		}
	}

	public static Map<String, String> toMap(JSONObject jsonobj) throws JSONException {
		Map<String, String> map = new HashMap<String, String>();
		Iterator<String> keys = jsonobj.keys();
		while(keys.hasNext()) {
			String key = keys.next();
			String value = jsonobj.get(key).toString();
//			if (value instanceof JSONArray) {
//				value = "";
//			} else if (value instanceof JSONObject) {
//				value = "";
//			}
			map.put(key, value);
		}
		return map;
	}
}
