import { Request, Response, sql } from "@elements/app";
import { normalizeCode } from "#app/shared/services/events";
import { MicEvent, questions, questionVotes, polls, pollResponses } from "#app/shared/services/live";
import html from "./template";

export default function route(req: Request, res: Response) {
  let event = sql<MicEvent>(`
    select id, title, code, moderated from events where code = ${normalizeCode(req.params.code)}
  `).firstOrThrow("event not found");

  let eventId = event.id;

  return new html({
    event,
    questions: questions.view({ eventId, status: "live" }),
    votes: questionVotes.view({ eventId }),
    polls: polls.view({ eventId, status: "open" }),
    responses: pollResponses.view({ eventId }),
  });
}
