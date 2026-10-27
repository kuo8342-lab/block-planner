步調 Pace Android App（TWA：全螢幕打開 https://block-planner-beta.vercel.app）

PaceApp.apk          簽好名、可直接安裝的 APK（網站上也有：https://block-planner-beta.vercel.app/pace.apk）
pace-release.keystore + signing-info.txt   簽章金鑰和密碼，務必備份、不要分享
assetlinks.json      網站驗證檔（部署在 /.well-known/assetlinks.json；pace-build/gen-pace-assets.js 會自動放上）

網站更新 → APK 不用重做，打開就是新版。
只有改 App 名稱、圖示、套件設定時才需要重做 APK：
  1. 改 twa-manifest.json，appVersionCode +1，執行 bubblewrap update --skipVersionUpgrade
  2. 把專案複製到沒有 & 的路徑（Gradle/apksigner 的 .bat 不能處理 &），JAVA_HOME 設 JDK 21，執行 gradlew.bat assembleRelease
  3. build-tools/35.0.0 的 zipalign -p 4，再用 apksigner 以 pace-release.keystore（alias pace）簽名
  4. node gen-pace-assets.js "D:/KIBO&/pace-planner" "D:/KIBO&/pace-apk/PaceApp.apk"，再 vercel deploy --prod --yes

桌面小工具（v1.1.0 起，2026-10-25）：
  app/src/main/java/app/pace/planner/PaceWidget.java、res/layout/pace_widget.xml、res/xml/pace_widget_info.xml、
  res/values*/widget.xml、res/drawable/widget_*.xml，AndroidManifest.xml 的 <receiver .PaceWidget>。
  按鈕打開網站的 #widget（便利貼）、#add（快速新增）、#focus（開始專注），網站那邊由 pace-build/build-c.js 處理。
  注意：bubblewrap update 會重寫 AndroidManifest.xml，小工具會不見；之後只改 build.gradle 的 versionCode 直接 gradlew 打包。

「步調・今天」小工具（v1.2.0 起）：PaceTodayWidget.java（顯示）、TodayData.java（用 Firestore REST 讀 users/{uid}/docs/weeks~週一）、
  WidgetLinkActivity.java（接收網站「設定 → 同步 → 連結 Android 桌面小工具」送來的 refresh token，intent scheme pacewidget://link）。
  res/values/firebase.xml 由 pace-build/firebase-config.json 產生（公開的網頁設定）。
  測試：app/src/test/.../TodayDataTest.java，需要 Firebase emulator（auth 9099、firestore 8080、project demo-pace）和 PACE_RT/PACE_UID 環境變數。
