package app.pace.planner;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

/**
 * Receives the sign-in from the web app's 「連結 Android 桌面小工具」 button
 * (intent://link#Intent;scheme=pacewidget;package=app.pace.planner;S.rt=…;S.uid=…;end),
 * stores it for PaceTodayWidget and closes straight away. An empty rt (sent on sign-out) unlinks.
 */
public class WidgetLinkActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent i = getIntent();
        String rt = i.getStringExtra("rt"), uid = i.getStringExtra("uid");
        boolean link = rt != null && !rt.isEmpty() && uid != null && !uid.isEmpty();
        PaceTodayWidget.prefs(this).edit()
                .putString(PaceTodayWidget.K_RT, link ? rt : "")
                .putString(PaceTodayWidget.K_UID, link ? uid : "")
                .remove(PaceTodayWidget.K_CACHE)
                .putString(PaceTodayWidget.K_STATE, link ? "loading" : "unlinked")
                .apply();
        Toast.makeText(this, link ? R.string.today_linked : R.string.today_unlinked, Toast.LENGTH_LONG).show();
        PaceTodayWidget.requestRefresh(this);
        finish();
    }
}
