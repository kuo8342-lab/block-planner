package app.pace.planner;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * Reads today's blocks for the "步調・今天" widget straight from Cloud Firestore over REST.
 * The web app mirrors every document to users/{uid}/docs/{path with / as ~} as { p, t, d, del };
 * this week's blocks are in weeks~YYYY-MM-DD (the Monday). Sign-in is the web app's refresh token,
 * handed over by WidgetLinkActivity, exchanged here for a short-lived ID token.
 * Plain Java (no Android classes) so it can be unit-tested against the Firebase emulator.
 */
public final class TodayData {
    public static final class Block {
        public final int start, minutes; public final String name, cat;
        Block(int start, int minutes, String name, String cat) { this.start = start; this.minutes = minutes; this.name = name; this.cat = cat; }
        public int end() { return start + minutes; }
    }

    /** Where to send requests; tests point these at the emulator. */
    public String tokenUrl = "https://securetoken.googleapis.com/v1/token";
    public String firestoreUrl = "https://firestore.googleapis.com/v1";
    private final String apiKey, project;

    public TodayData(String apiKey, String project) { this.apiKey = apiKey; this.project = project; }

    /** Returns { idToken, refreshToken } (Firebase may rotate the refresh token). */
    public String[] refresh(String refreshToken) throws Exception {
        String body = "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(refreshToken, "UTF-8");
        JSONObject r = new JSONObject(http(tokenUrl + "?key=" + apiKey, "POST", body, null));
        return new String[] { r.getString("id_token"), r.optString("refresh_token", refreshToken) };
    }

    /** Today's own blocks (not done, skipped or marked not finished), sorted by start time. Null = no document for this week. */
    public List<Block> today(String idToken, String uid, Calendar now) throws Exception {
        String url = firestoreUrl + "/projects/" + project + "/databases/(default)/documents/users/" + uid + "/docs/weeks~" + monday(now);
        String json;
        try { json = http(url, "GET", null, idToken); }
        catch (HttpError e) { if (e.code == 404) return Collections.emptyList(); throw e; }
        return parse(new JSONObject(json), dayIndex(now));
    }

    static List<Block> parse(JSONObject doc, int day) throws Exception {
        List<Block> out = new ArrayList<>();
        JSONObject f = doc.optJSONObject("fields"); if (f == null) return out;
        if (bool(f.optJSONObject("del"))) return out;
        JSONObject d = f.optJSONObject("d"); if (d == null || d.optJSONObject("mapValue") == null) return out;
        JSONObject week = d.getJSONObject("mapValue").optJSONObject("fields"); if (week == null) return out;
        JSONObject blocks = week.optJSONObject("blocks"); if (blocks == null) return out;
        JSONArray arr = blocks.optJSONObject("arrayValue") == null ? null : blocks.getJSONObject("arrayValue").optJSONArray("values");
        if (arr == null) return out;
        for (int i = 0; i < arr.length(); i++) {
            JSONObject m = arr.optJSONObject(i); if (m == null || m.optJSONObject("mapValue") == null) continue;
            JSONObject b = m.getJSONObject("mapValue").optJSONObject("fields"); if (b == null) continue;
            if (num(b.optJSONObject("day")) != day) continue;
            if (bool(b.optJSONObject("done")) || bool(b.optJSONObject("skipped")) || bool(b.optJSONObject("failed"))) continue;
            String start = str(b.optJSONObject("start")); if (start.length() < 4) continue;
            String[] hm = start.split(":");
            out.add(new Block(Integer.parseInt(hm[0].trim()) * 60 + Integer.parseInt(hm[1].trim()), (int) num(b.optJSONObject("minutes")),
                    str(b.optJSONObject("name")), str(b.optJSONObject("cat"))));
        }
        Collections.sort(out, (a, b) -> a.start - b.start);
        return out;
    }

    /* ---------- Firestore REST values ---------- */
    private static String str(JSONObject v) { return v == null ? "" : v.optString("stringValue", ""); }
    private static boolean bool(JSONObject v) { return v != null && v.optBoolean("booleanValue", false); }
    private static double num(JSONObject v) {
        if (v == null) return -1;
        if (v.has("integerValue")) return Double.parseDouble(v.optString("integerValue", "-1"));
        return v.optDouble("doubleValue", -1);
    }

    /* ---------- dates: Monday = day 0, matching the web app ---------- */
    public static int dayIndex(Calendar c) { return (c.get(Calendar.DAY_OF_WEEK) + 5) % 7; }
    public static String monday(Calendar now) {
        Calendar c = (Calendar) now.clone();
        c.add(Calendar.DAY_OF_MONTH, -dayIndex(now));
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /* ---------- http ---------- */
    public static final class HttpError extends Exception { public final int code; HttpError(int code, String body) { super(code + " " + body); this.code = code; } }

    private static String http(String url, String method, String form, String bearer) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000); c.setReadTimeout(15000); c.setRequestMethod(method);
        if (bearer != null) c.setRequestProperty("Authorization", "Bearer " + bearer);
        if (form != null) {
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            try (OutputStream o = c.getOutputStream()) { o.write(form.getBytes(StandardCharsets.UTF_8)); }
        }
        int code = c.getResponseCode();
        InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
        ByteArrayOutputStream buf = new ByteArrayOutputStream();
        if (in != null) { byte[] b = new byte[8192]; int n; while ((n = in.read(b)) > 0) buf.write(b, 0, n); in.close(); }
        String body = buf.toString("UTF-8");
        if (code >= 400) throw new HttpError(code, body);
        return body;
    }
}
