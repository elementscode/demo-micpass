import { NotFoundError, ValidationError, redirect, session, sql } from "@elements/app";
import { MicEvent, Question, questions } from "#app/shared/services/live";

// No 0/O, 1/I/L: a code read off a projector should not be ambiguous.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const CODE_LENGTH = 6;

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function mintCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }

  return code;
}

export interface EventForm {
  title: string;
  moderated: boolean;
  error: string;
}

/** @rpc */
export function createEvent(form: EventForm) {
  session.isLoggedInOrThrow();

  let title = form.title.trim();
  if (!title) {
    throw new ValidationError("Give the event a name.");
  }

  let code = mintCode();
  while (!sql(`select 1 from events where code = ${code}`).empty()) {
    code = mintCode();
  }

  let event = sql<MicEvent>(`
    insert into events (hostId, title, code, moderated)
         values (${session.getOrThrow("userId")}, ${title}, ${code}, ${form.moderated})
      returning *
  `).firstOrThrow();

  redirect(`/host/events/${event.id}`);
}

/** @rpc */
export function findEvent(code: string): string {
  let normalized = normalizeCode(code);
  if (!normalized) {
    throw new ValidationError("Enter the event code.");
  }

  let event = sql<{ code: string }>(`select code from events where code = ${normalized}`).first();
  if (!event) {
    throw new NotFoundError(`No event with the code ${normalized}.`);
  }

  return event.code;
}

export interface AskForm {
  body: string;
  authorName: string;
}

/**
 * Written on the server so the row reaches the host's view even while it is
 * pending, and reaches the audience's live partition only once it is live.
 */
/** @rpc */
export function askQuestion(eventId: string, askerId: string, form: AskForm): Question {
  let view = questions.view({ eventId });

  return view.insert({
    body: form.body,
    authorName: form.authorName,
    askerId,
    status: "live",
    pinned: false,
    answered: false,
    createdAt: new Date(),
  });
}

/**
 * A route guard for host pages: signed in, and the event is theirs. Someone
 * else's event is a 404, so an id does not reveal that it exists.
 */
export function hostedEvent(id: string): MicEvent | undefined {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  return sql<MicEvent>(`
    select * from events
     where id = ${id}
       and hostId = ${session.getOrThrow("userId")}
  `).firstOrThrow("event not found");
}
