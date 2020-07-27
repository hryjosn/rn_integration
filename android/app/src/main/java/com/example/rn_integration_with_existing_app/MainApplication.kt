package com.example.rn_integration_with_existing_app

import android.app.Application
import android.util.Log
import com.facebook.react.BuildConfig
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import com.oney.WebRTCModule.WebRTCModulePackage
import java.util.*

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost = object : ReactNativeHost(this) {
        override fun getUseDeveloperSupport(): Boolean {
            return BuildConfig.DEBUG
        }

        override fun getPackages(): List<ReactPackage> {
            Log.e("MainApplication","")
            return Arrays.asList<ReactPackage>(
                MainReactPackage(),
                WebRTCModulePackage()
            )
        }

//        override fun getJSMainModuleName(): String {
//            return "index"
//        }
    }

    override fun getReactNativeHost(): ReactNativeHost {
        return mReactNativeHost
    }

    override fun onCreate() {
        super.onCreate()
        Log.e("MainApplication","")
        SoLoader.init(this, /* native exopackage */ false)
    }
}