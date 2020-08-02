package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.util.ArrayList;

public class  ShareReceive extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.share_receive);

        if (SimpleClient.simpleClientStatic == null) {
            ((TextView) findViewById(R.id.textView2)).setText("You must be connected to a PC in order to send files.");
            return;
        }

        // get intent, action, MIME type
        Intent intent = getIntent();
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            // update UI
            ((TextView) findViewById(R.id.textView2)).setText("you are share image of quantity one.");

            // send
            Uri imageUri = null;
            try {
                imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }
            catch (Exception e) {
                ((TextView) findViewById(R.id.textView2)).setText("You may only share files using Lynx.");
                return;
            }

            if (imageUri != null) {
                // Update UI to reflect image being shared
                FileActions.files = new ArrayList<Uri>();
                FileActions.files.add(imageUri);
                try {
                    FileActions.sendFiles(new Intent(), true);
                }
                catch (Exception e) {
                    ((TextView) findViewById(R.id.textView2)).setText("You must be connected to a PC in order to send files.");
                    return;
                }
            }
            else {
                ((TextView) findViewById(R.id.textView2)).setText("You may only share files using Lynx.");
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            // update UI
            ((TextView) findViewById(R.id.textView2)).setText("you are many images");

            // send
            Uri imageUri = null;
            try {
                imageUri = (Uri) intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM).get(0);
            }
            catch (Exception e) {
                ((TextView) findViewById(R.id.textView2)).setText("You may only share files using Lynx.");
                return;
            }

            if (imageUri != null) {
                FileActions.files = new ArrayList<Uri>();
                FileActions.files = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                try {
                    FileActions.sendFiles(new Intent(), true);
                }
                catch (Exception e) {
                    ((TextView) findViewById(R.id.textView2)).setText("You must be connected to a PC in order to send files.");
                    return;
                }
            }
            else {
                ((TextView) findViewById(R.id.textView2)).setText("You may only share files using Lynx.");
            }
        } else {
            // Handle other intents, such as being started from the home screen
        }
    }
}
