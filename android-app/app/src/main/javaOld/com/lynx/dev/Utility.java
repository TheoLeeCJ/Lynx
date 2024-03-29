package com.lynx.dev;

import android.content.Context;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class Utility {
	public static JSONObject settings = null;

	public static String getSetting(String key) {
		try { return settings.get(key).toString(); }
		catch (JSONException e) { return ""; }
	}

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

	public static boolean writeSettings(Context context, String settings) {
		try (FileOutputStream fos = context.openFileOutput("config.json", Context.MODE_PRIVATE)) {
			fos.write(settings.getBytes());
			return true;
		}
		catch (Exception e) {
			return false;
		}
	}
}
