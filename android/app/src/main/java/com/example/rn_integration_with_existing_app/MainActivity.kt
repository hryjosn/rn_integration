package com.example.rn_integration_with_existing_app

import android.provider.Settings
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.content.Intent
import android.os.Build
import android.net.Uri
import android.util.Log
import android.view.View
import com.facebook.react.ReactInstanceManager


private const val OVERLAY_PERMISSION_REQ_CODE = 1  // Choose any value
private val mReactInstanceManager: ReactInstanceManager? = null

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE)
            }
        }
    }
    fun onAddRNClick(view: View) {
        // Set up the intent
        val i = Intent(this, MyReactActivity::class.java)
        // Launch It
        startActivity(i)
    }
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    // SYSTEM_ALERT_WINDOW permission not granted
                }
            }
        }
        mReactInstanceManager?.onActivityResult(this, requestCode, resultCode, data)
    }
}
