import { Request, Response, redirect, session, sql } from "@elements/app";
import html, { EventSummary } from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let events = sql<EventSummary>(`
    select e.id, e.title, e.code, e.createdAt,
           (select count(*)::int from questions q where q.eventId = e.id) as questionCount,
           (select count(*)::int from polls p where p.eventId = e.id) as pollCount
      from events e
     where e.hostId = ${session.getOrThrow("userId")}
     order by e.createdAt desc
  `).all();

  return new html({ events });
}
