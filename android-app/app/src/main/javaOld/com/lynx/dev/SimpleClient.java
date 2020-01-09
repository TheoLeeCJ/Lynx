package com.lynx.dev;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;

import org.java_websocket.client.WebSocketClient;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ServerHandshake;

public class SimpleClient extends WebSocketClient {
	public SimpleClient(URI serverURI) {
		super(serverURI);
	}

	public WebAppInterfaceV2 webAppInterface;

	@Override
	public void onOpen(ServerHandshake handshakedata) {
		System.out.println("new connection opened");
	}

	public void sendText(String text) {
		send(text);
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		System.out.println("closed with exit code " + code + " additional info: " + reason);
	}

	@Override
	public void onMessage(String message) {
		webAppInterface.htmlLog("[ WS ] " + message);
		System.out.println("received message: " + message);
	}

	@Override
	public void onMessage(ByteBuffer message) {
		System.out.println("received ByteBuffer");
	}

	@Override
	public void onError(Exception ex) {
		System.err.println("an error occurred:" + ex);
	}
}