import { Request, Response } from "@elements/app";
import { hostedEvent } from "#app/shared/services/events";
import { events, questions, questionVotes, polls, pollResponses } from "#app/shared/services/live";
import html from "./template";

export default function route(req: Request, res: Response) {
  let event = hostedEvent(req.params.id);
  if (!event) {
    return;
  }

  let eventId = event.id;

  return new html({
    event: events.view({ id: eventId }),
    questions: questions.view({ eventId, status: "live" }),
    votes: questionVotes.view({ eventId }),
    polls: polls.view({ eventId }),
    responses: pollResponses.view({ eventId }),
    origin: String(req.headers.host ?? ""),
  });
}
