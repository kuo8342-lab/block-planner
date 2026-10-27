package app.pace.planner;

import static org.junit.Assert.assertEquals;
import static org.junit.Assume.assumeTrue;

import org.junit.Test;

import java.util.Calendar;
import java.util.List;

/**
 * Reads blocks through the same REST calls the widget makes, against the Firebase emulator
 * (auth :9099, firestore :8080, project demo-pace). Seed data: PACE_RT / PACE_UID from emu/seed.js.
 * Skipped when those are not set.
 */
public class TodayDataTest {
    @Test
    public void readsTodaysOpenBlocksFromEmulator() throws Exception {
        String rt = System.getenv("PACE_RT"), uid = System.getenv("PACE_UID");
        assumeTrue(rt != null && uid != null);
        TodayData d = new TodayData("fake-key", "demo-pace");
        d.tokenUrl = "http://127.0.0.1:9099/securetoken.googleapis.com/v1/token";
        d.firestoreUrl = "http://127.0.0.1:8080/v1";
        String[] tokens = d.refresh(rt);
        List<TodayData.Block> blocks = d.today(tokens[0], uid, Calendar.getInstance());
        // done, skipped and tomorrow's blocks are left out; the rest come back sorted by start time
        assertEquals(2, blocks.size());
        assertEquals("早就過了", blocks.get(0).name);
        assertEquals(10, blocks.get(0).start);
        assertEquals("今天最後一個", blocks.get(1).name);
        assertEquals(23 * 60 + 58, blocks.get(1).start);
        assertEquals(30, blocks.get(1).minutes);
    }

    @Test
    public void missingWeekIsEmptyNotAnError() throws Exception {
        String rt = System.getenv("PACE_RT");
        assumeTrue(rt != null);
        TodayData d = new TodayData("fake-key", "demo-pace");
        d.tokenUrl = "http://127.0.0.1:9099/securetoken.googleapis.com/v1/token";
        d.firestoreUrl = "http://127.0.0.1:8080/v1";
        String[] tokens = d.refresh(rt);
        Calendar farAway = Calendar.getInstance(); farAway.add(Calendar.YEAR, 3);
        assertEquals(0, d.today(tokens[0], System.getenv("PACE_UID"), farAway).size());
    }

    @Test
    public void mondayIsDayZero() {
        Calendar c = Calendar.getInstance(); c.set(2026, Calendar.OCTOBER, 25);   // a Sunday
        assertEquals(6, TodayData.dayIndex(c));
        assertEquals("2026-10-19", TodayData.monday(c));
    }
}
