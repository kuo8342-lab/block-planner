package app.pace.planner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

/**
 * Home-screen shortcut widget: the app name plus three buttons that open the web app on a given screen.
 * The web app reads the #widget / #add / #focus part of the address (see build-c.js in pace-build).
 * It shows no schedule data: the data lives inside the web app, which a native widget cannot read.
 */
public class PaceWidget extends AppWidgetProvider {
    private static final String SITE = "https://block-planner-beta.vercel.app/";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.pace_widget);
            views.setOnClickPendingIntent(R.id.widget_open, open(context, "", 0));
            views.setOnClickPendingIntent(R.id.widget_note, open(context, "#widget", 1));
            views.setOnClickPendingIntent(R.id.widget_add, open(context, "#add", 2));
            views.setOnClickPendingIntent(R.id.widget_focus, open(context, "#focus", 3));
            manager.updateAppWidget(id, views);
        }
    }

    static PendingIntent open(Context context, String hash, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(SITE + hash), context, LauncherActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
