package com.Bakery.zomoggy;

import android.Manifest;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.app.Dialog;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;
import com.google.android.play.core.review.ReviewInfo;
import com.google.android.gms.tasks.Task;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;
import android.content.IntentSender;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> uploadMessage;
    private boolean doubleBackToExitPressedOnce = false;
    private String fcmToken = "";
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private androidx.appcompat.app.AlertDialog offlineDialog;
    private AppUpdateManager appUpdateManager;
    private static final int MY_REQUEST_CODE = 100;
    private GeolocationPermissions.Callback savedGeolocationCallback;
    private String savedGeolocationOrigin;

    // Permission Launchers
    private final ActivityResultLauncher<String> requestLocationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    if (savedGeolocationCallback != null) {
                        savedGeolocationCallback.invoke(savedGeolocationOrigin, true, false);
                        savedGeolocationCallback = null;
                        savedGeolocationOrigin = null;
                    }
                } else {
                    if (savedGeolocationCallback != null) {
                        savedGeolocationCallback.invoke(savedGeolocationOrigin, false, false);
                        savedGeolocationCallback = null;
                        savedGeolocationOrigin = null;
                    }
                    Toast.makeText(this, "Location permission required for geolocation features", Toast.LENGTH_SHORT).show();
                }
            });

    private final ActivityResultLauncher<String> requestNotificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                // Permission handled
            });
            
    // File Upload Launcher
    private final ActivityResultLauncher<Intent> fileUploadLauncher =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
                if (uploadMessage == null) return;
                Uri[] results = null;
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    if (result.getData().getData() != null) {
                        results = new Uri[]{result.getData().getData()};
                    } else if (result.getData().getClipData() != null) {
                         int count = result.getData().getClipData().getItemCount();
                         results = new Uri[count];
                         for(int i = 0; i<count; i++){
                             results[i] = result.getData().getClipData().getItemAt(i).getUri();
                         }
                    }
                }
                uploadMessage.onReceiveValue(results);
                uploadMessage = null;
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON); // Keep screen active for Admin
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        swipeRefreshLayout = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);

        setupWebView();
        setupSwipeRefresh();
        checkPermissions();
        setupSwipeRefresh();
        checkPermissions();
        setupNetworkCallback();  // New Offline Handling
        setupBackPressHandler();
        checkForAppUpdate(); // In-App Update Check
        
        if (savedInstanceState == null) {
            webView.loadUrl("https://zomoggy.in");
        }

        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful()) {
                return;
            }
            // Get new FCM registration token
            fcmToken = task.getResult();
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (connectivityManager != null && networkCallback != null) {
            connectivityManager.unregisterNetworkCallback(networkCallback);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (appUpdateManager != null) {
             appUpdateManager
                .getAppUpdateInfo()
                .addOnSuccessListener(appUpdateInfo -> {
                    if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                        try {
                            appUpdateManager.startUpdateFlowForResult(
                                appUpdateInfo,
                                AppUpdateType.IMMEDIATE,
                                this,
                                MY_REQUEST_CODE);
                        } catch (IntentSender.SendIntentException e) {
                            e.printStackTrace();
                        }
                    }
                });
        }
    }
    
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true); 
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }
        
        // Use a standard Mobile Chrome User agent to ensure payment gateways recognize the browser
        String chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
        settings.setUserAgentString(chromeUA + " ZomoggyApp/1.0");

        // Add Native Bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                android.util.Log.d("WebViewRedirection", "Loading URL: " + url);

                if (url.startsWith("http://") || url.startsWith("https://")) {
                    // Handle WhatsApp Web or other specific exceptions
                    if (url.contains("api.whatsapp.com") || url.contains("wa.me")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            view.getContext().startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            return false; // Fallback to WebView
                        }
                    }
                    return false; // Load in WebView
                }

                // Handle Intent and specific schemes (UPI, etc.)
                try {
                    Intent intent = null;
                    if (url.startsWith("intent://")) {
                        intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                    } else if (url.startsWith("upi:") || url.startsWith("phonepe:") || 
                             url.startsWith("paytmmp:") || url.startsWith("gpay:") || 
                             url.startsWith("tez:")) {
                        intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    }

                    if (intent != null) {
                        try {
                            // Verify if there's an app that can handle this intent
                            if (intent.resolveActivity(view.getContext().getPackageManager()) != null) {
                                view.getContext().startActivity(intent);
                                return true;
                            } else {
                                // Fallback for intent:// schemes
                                String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                                if (fallbackUrl != null) {
                                    view.loadUrl(fallbackUrl);
                                    return true;
                                }
                                // Market fallback
                                String packageName = intent.getPackage();
                                if (packageName != null) {
                                    view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, 
                                        Uri.parse("market://details?id=" + packageName)));
                                    return true;
                                }
                            }
                        } catch (Exception e) {
                            android.util.Log.e("WebViewRedirection", "Intent launch failed", e);
                        }
                    } else {
                        // General fallback for unknown schemes (tel:, mailto:, etc.)
                        Intent generalIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        if (generalIntent.resolveActivity(view.getContext().getPackageManager()) != null) {
                            view.getContext().startActivity(generalIntent);
                            return true;
                        }
                    }
                } catch (Exception e) {
                    android.util.Log.e("WebViewRedirection", "URL Override Error", e);
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                if (request.isForMainFrame()) {
                     view.loadUrl("file:///android_asset/error.html");
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                swipeRefreshLayout.setRefreshing(false);
                super.onPageFinished(view, url);
                if (fcmToken != null && !fcmToken.isEmpty()) {
                    // Fixed JS string concatenation
                    view.evaluateJavascript("if(window.receiveFcmToken) { window.receiveFcmToken('" + fcmToken + "'); }", null);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    if (progressBar.getVisibility() == View.GONE) {
                        progressBar.setVisibility(View.VISIBLE);
                    }
                    progressBar.setProgress(newProgress);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    savedGeolocationCallback = callback;
                    savedGeolocationOrigin = origin;
                    requestLocationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION);
                } else {
                    callback.invoke(origin, true, false);
                }
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final android.webkit.JsResult result) {
                new androidx.appcompat.app.AlertDialog.Builder(view.getContext())
                        .setTitle("Zomoggy")
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final android.webkit.JsResult result) {
                new androidx.appcompat.app.AlertDialog.Builder(view.getContext())
                        .setTitle("Zomoggy")
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                        .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                        .setCancelable(false)
                        .create()
                        .show();
                return true;
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView newWebView = new WebView(MainActivity.this);
                WebSettings webSettings = newWebView.getSettings();
                webSettings.setJavaScriptEnabled(true);
                webSettings.setDomStorageEnabled(true);
                webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
                webSettings.setSupportMultipleWindows(true);
                
                String chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
                webSettings.setUserAgentString(chromeUA + " ZomoggyApp/1.0");

                final Dialog dialog = new Dialog(MainActivity.this);
                dialog.setContentView(newWebView);
                dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                dialog.show();

                newWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        String url = request.getUrl().toString();
                        android.util.Log.d("WebViewRedirection", "Popup URL: " + url);

                        if (url.startsWith("http://") || url.startsWith("https://")) {
                            return false; 
                        }

                        // Handle Intent and specific schemes (UPI, etc.)
                        try {
                            Intent intent = null;
                            if (url.startsWith("intent://")) {
                                intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                            } else if (url.startsWith("upi:") || url.startsWith("phonepe:") || 
                                     url.startsWith("paytmmp:") || url.startsWith("gpay:") || 
                                     url.startsWith("tez:")) {
                                intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            }

                            if (intent != null) {
                                try {
                                    if (intent.resolveActivity(view.getContext().getPackageManager()) != null) {
                                        view.getContext().startActivity(intent);
                                        dialog.dismiss();
                                        return true;
                                    } else {
                                        String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                                        if (fallbackUrl != null) {
                                            view.loadUrl(fallbackUrl);
                                            return true;
                                        }
                                        String packageName = intent.getPackage();
                                        if (packageName != null) {
                                            view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, 
                                                Uri.parse("market://details?id=" + packageName)));
                                            dialog.dismiss();
                                            return true;
                                        }
                                    }
                                } catch (Exception e) {
                                    android.util.Log.e("WebViewRedirection", "Popup intent failed", e);
                                }
                            } else {
                                Intent generalIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                if (generalIntent.resolveActivity(view.getContext().getPackageManager()) != null) {
                                    view.getContext().startActivity(generalIntent);
                                    return true;
                                }
                            }
                        } catch (Exception e) {
                            // Ignore
                        }
                        return true;
                    }
                });

                newWebView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onCloseWindow(WebView window) {
                        dialog.dismiss();
                    }
                });

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(newWebView);
                resultMsg.sendToTarget();
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    fileUploadLauncher.launch(intent);
                } catch (ActivityNotFoundException e) {
                    uploadMessage = null;
                    Toast.makeText(MainActivity.this, "Cannot open file chooser", Toast.LENGTH_LONG).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimetype);
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading file...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype));
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimetype));
                
                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "Downloading File", Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(getApplicationContext(), "Download Failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Native Bridge Interface
    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @android.webkit.JavascriptInterface
        public void playAlertSound() {
            try {
                Uri notification = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE);
                android.media.Ringtone r = android.media.RingtoneManager.getRingtone(getApplicationContext(), notification);
                r.play();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @android.webkit.JavascriptInterface
        public void shareContent(String title, String url) {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_TEXT, title + "\n" + url);
            sendIntent.setType("text/plain");
            Intent shareIntent = Intent.createChooser(sendIntent, "Share via");
            mContext.startActivity(shareIntent);
        }

        @android.webkit.JavascriptInterface
        public void requestReview() {
            ReviewManager manager = ReviewManagerFactory.create(MainActivity.this);
            Task<ReviewInfo> request = manager.requestReviewFlow();
            request.addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    ReviewInfo reviewInfo = task.getResult();
                    Task<Void> flow = manager.launchReviewFlow(MainActivity.this, reviewInfo);
                    flow.addOnCompleteListener(flowTask -> {
                        // The flow has finished, whether valid or not.
                    });
                }
            });
        }
    }

    private void setupNetworkCallback() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager != null) {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onAvailable(Network network) {
                    runOnUiThread(() -> {
                        hideOfflineDialog();
                        if (webView.getUrl() == null || webView.getUrl().equals("file:///android_asset/error.html")) {
                             webView.reload();
                        }
                    });
                }

                @Override
                public void onLost(Network network) {
                    runOnUiThread(() -> showOfflineDialog());
                }
            };
            connectivityManager.registerNetworkCallback(new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build(), networkCallback);
        }
    }

    private void showOfflineDialog() {
        if (offlineDialog == null) {
            offlineDialog = new androidx.appcompat.app.AlertDialog.Builder(this)
                    .setTitle("No Internet Connection")
                    .setMessage("Please check your internet connection and try again.")
                    .setCancelable(false)
                    .setPositiveButton("Retry", (dialog, which) -> {
                         // Connectivity check will handle retry
                         if(isNetworkAvailable()) {
                             dialog.dismiss();
                             webView.reload();
                         }
                    })
                    .create();
        }
        if (!offlineDialog.isShowing()) {
            offlineDialog.show();
        }
    }

    private void hideOfflineDialog() {
        if (offlineDialog != null && offlineDialog.isShowing()) {
            offlineDialog.dismiss();
        }
    }

    private boolean isNetworkAvailable() {
        if (connectivityManager != null) {
             Network network = connectivityManager.getActiveNetwork();
             if (network != null) {
                  NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
                  return capabilities != null && (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR));
             }
        }
        return false;
    }

    private void setupSwipeRefresh() {
        // Disable Pull-to-Refresh permanently as requested
        swipeRefreshLayout.setEnabled(false);
        swipeRefreshLayout.setRefreshing(false);
    }

    private void checkForAppUpdate() {
        appUpdateManager = AppUpdateManagerFactory.create(this);
        Task<AppUpdateInfo> appUpdateInfoTask = appUpdateManager.getAppUpdateInfo();

        appUpdateInfoTask.addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                    && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                            appUpdateInfo,
                            AppUpdateType.IMMEDIATE,
                            this,
                            MY_REQUEST_CODE);
                } catch (IntentSender.SendIntentException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private void checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestLocationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }

    private void setupBackPressHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (doubleBackToExitPressedOnce) {
                        finish();
                        return;
                    }

                    doubleBackToExitPressedOnce = true;
                    Toast.makeText(MainActivity.this, "Press BACK again to exit", Toast.LENGTH_SHORT).show();

                    new Handler(Looper.getMainLooper()).postDelayed(() -> doubleBackToExitPressedOnce = false, 2000);
                }
            }
        });
    }
}