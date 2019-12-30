package com.lynx.dev;

import android.content.Context;
import android.media.MediaScannerConnection;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;

import java.io.File;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

public class SimpleServer extends WebSocketServer implements Runnable {
	Context mContext = null;

	public SimpleServer(InetSocketAddress address, Context parentContext) {
		super(address);
		mContext = parentContext;
	}

	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		conn.send("Welcome to the server!"); //This method sends a message to the new client
		broadcast( "new connection: " + handshake.getResourceDescriptor() ); //This method sends a message to all clients connected
		System.out.println("new connection to " + conn.getRemoteSocketAddress());
	}

	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
		System.out.println("closed " + conn.getRemoteSocketAddress() + " with exit code " + code + " additional info: " + reason);
	}

	@Override
	public void onMessage(WebSocket conn, String message) {
		System.out.println(message.equals("frame_please"));
		if (message.equals("frame_please")) {
			conn.send(MainActivity.base64screen);
		}
	}

	@Override
	public void onMessage( WebSocket conn, ByteBuffer message ) {
		System.out.println("received ByteBuffer from "	+ conn.getRemoteSocketAddress());

		try {
			File directory = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
			File file = new File(directory, "ouch.png");

			FileOutputStream outputStream = new FileOutputStream(file);
			outputStream.getChannel().write(message);
			outputStream.getChannel().close();

			MediaScannerConnection.scanFile(mContext, new String[] {file.getAbsolutePath()}, null, null);
		}
		catch (Exception e) {
			System.out.println("Error occurred during file write " + mContext.getFilesDir().getPath() + ": " + e.toString());
		}

		System.out.println(mContext.getFilesDir().getPath() + "/data.png");
		MediaScannerConnection.scanFile(mContext, new String[] {mContext.getFilesDir().getPath() + "/data.png"}, null, null);
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
		System.err.println("an error occurred on connection " + conn.getRemoteSocketAddress()  + ":" + ex);
	}

	@Override
	public void onStart() {
		System.out.println("server started successfully");
	}
}