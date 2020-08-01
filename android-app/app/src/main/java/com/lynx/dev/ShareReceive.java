package com.lynx.dev;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;

import java.io.File;
import java.util.ArrayList;

public class ShareReceive extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.share_receive);

        // Get intent, action and MIME type
        Intent intent = getIntent();
        String action = intent.getAction();
        String type = intent.getType();

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if ("text/plain".equals(type)) {
                ((TextView) findViewById(R.id.textView2)).setText("");
            } else if (type.startsWith("image/")) {
                ((TextView) findViewById(R.id.textView2)).setText("you are share image of quantity one.");
                Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
                if (imageUri != null) {
                    // Update UI to reflect image being shared
                    FileActions.files = new ArrayList<Uri>();
                    FileActions.files.add(imageUri);
                    FileActions.sendFiles(new Intent(), true);
                }
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            if (type.startsWith("image/")) {
                ((TextView) findViewById(R.id.textView2)).setText("you are many images");
                FileActions.files = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                FileActions.sendFiles(new Intent(), true);
            }
        } else {
            // Handle other intents, such as being started from the home screen
        }
    }
}
