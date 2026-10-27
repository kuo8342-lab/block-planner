package app.pace.planner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * 「步調・今天」 widget: what to do now / next and the rest of today's blocks, plus the shortcut buttons.
 * Data comes from the signed-in user's cloud copy (see TodayData); the last result is cached so the widget
 * still shows something offline. Android refreshes it about every 30 minutes; the ↻ button refreshes now.
 */
public class PaceTodayWidget extends AppWidgetProvider {
    static final String PREFS = "pace_widget", REFRESH = "app.pace.planner.REFRESH_TODAY";
    static final String K_RT = "rt", K_UID = "uid", K_CACHE = "cache", K_STATE = "state";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        renderAll(context);
        refreshInBackground(context, goAsync());
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (REFRESH.equals(intent.getAction())) {
            prefs(context).edit().putString(K_STATE, "loading").apply();
            renderAll(context);
            refreshInBackground(context, goAsync());
            return;
        }
        super.onReceive(context, intent);
    }

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static void requestRefresh(Context c) {
        c.sendBroadcast(new Intent(REFRESH).setClass(c, PaceTodayWidget.class));
    }

    private static void refreshInBackground(Context context, PendingResult pending) {
        final Context app = context.getApplicationContext();
        new Thread(() -> {
            SharedPreferences p = prefs(app);
            String rt = p.getString(K_RT, ""), uid = p.getString(K_UID, "");
            try {
                if (rt.isEmpty() || uid.isEmpty()) { p.edit().putString(K_STATE, "unlinked").apply(); return; }
                TodayData data = new TodayData(app.getString(R.string.firebase_api_key), app.getString(R.string.firebase_project));
                String[] tokens;
                try { tokens = data.refresh(rt); }
                catch (TodayData.HttpError e) { p.edit().putString(K_STATE, "relink").apply(); return; }   // sign-in revoked or expired
                Calendar now = Calendar.getInstance();
                List<TodayData.Block> blocks = data.today(tokens[0], uid, now);
                JSONArray arr = new JSONArray();
                for (TodayData.Block b : blocks) arr.put(new JSONObject().put("s", b.start).put("m", b.minutes).put("n", b.name).put("c", b.cat));
                JSONObject cache = new JSONObject().put("date", TodayData.monday(now) + "/" + TodayData.dayIndex(now)).put("at", System.currentTimeMillis()).put("blocks", arr);
                p.edit().putString(K_RT, tokens[1]).putString(K_CACHE, cache.toString()).putString(K_STATE, "ok").apply();
            } catch (Exception e) {
                p.edit().putString(K_STATE, "offline").apply();
            } finally {
                renderAll(app);
                pending.finish();
            }
        }).start();
    }

    static void renderAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, PaceTodayWidget.class));
        if (ids.length == 0) return;
        RemoteViews v = views(c);
        for (int id : ids) m.updateAppWidget(id, v);
    }

    private static RemoteViews views(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.pace_today);
        SharedPreferences p = prefs(c);
        String state = p.getString(K_STATE, p.getString(K_RT, "").isEmpty() ? "unlinked" : "loading");
        Calendar now = Calendar.getInstance();
        int nowMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        String main, list = "", updated = "";
        List<int[]> times = new ArrayList<>(); List<String> names = new ArrayList<>();
        boolean haveToday = false;
        try {
            JSONObject cache = new JSONObject(p.getString(K_CACHE, "{}"));
            if ((TodayData.monday(now) + "/" + TodayData.dayIndex(now)).equals(cache.optString("date"))) {
                haveToday = true;
                Calendar at = Calendar.getInstance(); at.setTimeInMillis(cache.optLong("at"));
                updated = c.getString(R.string.today_updated, hm(at.get(Calendar.HOUR_OF_DAY) * 60 + at.get(Calendar.MINUTE)));
                JSONArray arr = cache.optJSONArray("blocks");
                for (int i = 0; arr != null && i < arr.length(); i++) {
                    JSONObject b = arr.getJSONObject(i);
                    int s = b.optInt("s"), e = s + b.optInt("m");
                    if (e <= nowMin) continue;   // already over
                    times.add(new int[] { s, e }); names.add(b.optString("n"));
                }
            }
        } catch (Exception ignored) { }

        if ("unlinked".equals(state) && !haveToday) { main = c.getString(R.string.today_unlinked_title); list = c.getString(R.string.today_unlinked_hint); }
        else if ("relink".equals(state)) { main = c.getString(R.string.today_relink_title); list = c.getString(R.string.today_unlinked_hint); }
        else if (!haveToday) { main = c.getString("offline".equals(state) ? R.string.today_offline : R.string.today_loading); }
        else if (times.isEmpty()) { main = c.getString(R.string.today_none); }
        else {
            int[] t = times.get(0);
            main = t[0] <= nowMin ? c.getString(R.string.today_now, names.get(0), hm(t[1])) : c.getString(R.string.today_next, hm(t[0]), names.get(0));
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i < times.size() && i <= 3; i++) sb.append(sb.length() > 0 ? "\n" : "").append(hm(times.get(i)[0])).append("  ").append(names.get(i));
            if (times.size() > 4) sb.append("\n").append(c.getString(R.string.today_more, times.size() - 4));
            list = sb.toString();
        }
        if ("offline".equals(state) && haveToday) updated = updated + " · " + c.getString(R.string.today_offline_short);

        v.setTextViewText(R.id.today_main, main);
        v.setTextViewText(R.id.today_list, list);
        v.setTextViewText(R.id.today_updated, updated);
        v.setOnClickPendingIntent(R.id.today_body, PaceWidget.open(c, "", 10));
        v.setOnClickPendingIntent(R.id.today_note, PaceWidget.open(c, "#widget", 11));
        v.setOnClickPendingIntent(R.id.today_add, PaceWidget.open(c, "#add", 12));
        v.setOnClickPendingIntent(R.id.today_focus, PaceWidget.open(c, "#focus", 13));
        v.setOnClickPendingIntent(R.id.today_refresh, PendingIntent.getBroadcast(c, 14,
                new Intent(REFRESH).setClass(c, PaceTodayWidget.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return v;
    }

    private static String hm(int min) { return String.format(Locale.US, "%02d:%02d", min / 60 % 24, min % 60); }
}
