import { getStore } from "@netlify/blobs";

// One-time, manually-triggered restore for tasks that were lost to the
// seeding race bug on Aug 9. Idempotent: safe to hit more than once, it
// only adds a task if an identical date+text pair isn't already present.
// Not on the hot GET/POST path, so it can't race with normal usage.
const RESTORE_TASKS: { date: string; time: string; text: string }[] = [
  { date: "2026-08-09", time: "", text: "yt live pvc - story" },
  { date: "2026-08-09", time: "", text: "Parth bbsr tickets" },
  { date: "2026-08-09", time: "16:30", text: "YT Live- PVC CFA" },
  { date: "2026-08-09", time: "15:00", text: "CFA L1 August live" }
];

export default async (req: Request) => {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin");
  const correct = Netlify.env.get("APP_PIN");
  if (!pin || !correct || pin !== correct) {
    return new Response("Unauthorized: add ?pin=YOUR_PIN to the URL", { status: 401 });
  }

  const store = getStore({ name: "calendar", consistency: "strong" });
  const tasks: any[] = (await store.get("tasks", { type: "json" })) || [];

  let added = 0;
  RESTORE_TASKS.forEach((r) => {
    const exists = tasks.some((t) => t.date === r.date && t.text === r.text);
    if (!exists) {
      tasks.push({
        id: crypto.randomUUID(),
        owner: "aashi",
        type: "task",
        date: r.date,
        time: r.time,
        endTime: "",
        text: r.text,
        assignedBy: "aashi",
        done: false
      });
      added++;
    }
  });

  if (added > 0) {
    await store.setJSON("tasks", tasks);
  }

  return new Response(
    `Restored ${added} task(s). Total tasks now: ${tasks.length}. You can close this tab and go back to the calendar.`,
    { headers: { "content-type": "text/plain" } }
  );
};

export const config = {
  path: "/api/migrate"
};
