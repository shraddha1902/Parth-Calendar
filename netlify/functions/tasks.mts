import { getStore } from "@netlify/blobs";

function checkPin(req: Request): boolean {
  const pin = req.headers.get("x-app-pin");
  const correct = Netlify.env.get("APP_PIN");
  return !!pin && !!correct && pin === correct;
}

type Task = {
  id: string;
  owner: "aashi" | "parth";
  type: "task" | "class";
  date: string;
  time: string;
  endTime: string;
  text: string;
  assignedBy: "aashi" | "parth";
  done: boolean;
};

export default async (req: Request) => {
  if (!checkPin(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }

  const store = getStore({ name: "calendar", consistency: "strong" });

  if (req.method === "GET") {
    const tasks = (await store.get("tasks", { type: "json" })) || [];
    return new Response(JSON.stringify({ tasks }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }

  if (req.method === "POST") {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "bad json" }), {
        status: 400,
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      });
    }

    let tasks: Task[] = (await store.get("tasks", { type: "json" })) || [];

    if (body.action === "create") {
      const t = body.task || {};
      const newTask: Task = {
        id: crypto.randomUUID(),
        owner: t.owner === "parth" ? "parth" : "aashi",
        type: t.type === "class" ? "class" : "task",
        date: t.date,
        time: t.time || "",
        endTime: t.endTime || "",
        text: (t.text || "").trim(),
        assignedBy: t.assignedBy === "parth" ? "parth" : "aashi",
        done: false
      };
      if (!newTask.date || !newTask.text) {
        return new Response(JSON.stringify({ error: "date and text required" }), {
          status: 400,
          headers: { "content-type": "application/json", "cache-control": "no-store" }
        });
      }
      tasks.push(newTask);
    } else if (body.action === "update") {
      const patch = body.task || {};
      tasks = tasks.map((t) => (t.id === patch.id ? { ...t, ...patch } : t));
    } else if (body.action === "delete") {
      const id = body.task && body.task.id;
      tasks = tasks.filter((t) => t.id !== id);
    } else {
      return new Response(JSON.stringify({ error: "unknown action" }), {
        status: 400,
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      });
    }

    await store.setJSON("tasks", tasks);
    return new Response(JSON.stringify({ tasks }), {
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = {
  path: "/api/tasks"
};
