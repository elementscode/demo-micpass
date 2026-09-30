import { LiveTable, LiveView, ForbiddenError, ValidationError, session, sql } from "@elements/app";

export interface MicEvent {
  id: string;
  hostId: string;
  title: string;
  code: string;
  moderated: boolean;
  showPollId: string | null;
  createdAt: Date;
}

export type QuestionStatus = "pending" | "live" | "hidden";

export interface Question {
  id: string;
  eventId: string;
  body: string;
  authorName: string;
  askerId: string;
  status: QuestionStatus;
  pinned: boolean;
  answered: boolean;
  createdAt: Date;
}

export interface QuestionVote {
  id: string;
  eventId: string;
  questionId: string;
  voterId: string;
}

export type PollKind = "choice" | "words";

export type PollStatus = "draft" | "open" | "closed";

export interface Poll {
  id: string;
  eventId: string;
  prompt: string;
  kind: PollKind;
  options: string[];
  status: PollStatus;
  createdAt: Date;
}

export interface PollResponse {
  id: string;
  eventId: string;
  pollId: string;
  voterId: string;
  choice: number | null;
  word: string | null;
}

export const MAX_QUESTION = 280;

export const MAX_WORD = 24;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireVoter(voterId: string | undefined) {
  if (!voterId || !UUID.test(voterId)) {
    throw new ValidationError("Missing voter id.");
  }
}

/**
 * Checks the stored row's event, not the one the browser sent, so a host
 * cannot reach another host's rows by rewriting eventId.
 */
function requireHost(eventId: string) {
  session.isLoggedInOrThrow();

  let owned = sql(`
    select 1 from events
     where id = ${eventId}
       and hostId = ${session.getOrThrow("userId")}
  `);

  if (owned.empty()) {
    throw new ForbiddenError();
  }
}

function storedEventId(table: "questions" | "polls", id: string): string {
  let row = table === "questions"
    ? sql<{ eventId: string }>(`select eventId from questions where id = ${id}`).first()
    : sql<{ eventId: string }>(`select eventId from polls where id = ${id}`).first();

  if (!row) {
    throw new ForbiddenError();
  }

  return row.eventId;
}

export let events: LiveTable<MicEvent> = new LiveTable<MicEvent>({
  insert: () => {
    throw new ForbiddenError("Create events with createEvent.");
  },

  update: (item) => {
    requireHost(item.id);

    return sql<MicEvent>(`
      update events
         set title = ${item.title.trim() || "Untitled event"},
             moderated = ${item.moderated},
             showPollId = ${item.showPollId}
       where id = ${item.id}
   returning *
    `).firstOrThrow();
  },

  delete: (item) => {
    requireHost(item.id);
    events.delete(item);
  },
});

/**
 * Audience questions arrive through askQuestion, which writes on the server,
 * so the browser only ever updates (host moderation) through this table.
 */
export let questions: LiveTable<Question> = new LiveTable<Question>({
  insert: (item) => {
    requireVoter(item.askerId);

    let event = sql<{ moderated: boolean }>(`select moderated from events where id = ${item.eventId}`)
      .firstOrThrow("event not found");

    let body = (item.body ?? "").trim();
    if (!body) {
      throw new ValidationError("Write a question first.");
    }

    if (body.length > MAX_QUESTION) {
      throw new ValidationError(`Keep it under ${MAX_QUESTION} characters.`);
    }

    return questions.insert({
      id: item.id,
      eventId: item.eventId,
      body,
      authorName: (item.authorName ?? "").trim().slice(0, 40),
      askerId: item.askerId,
      status: event.moderated ? "pending" : "live",
      pinned: false,
      answered: false,
    });
  },

  update: (item) => {
    requireHost(storedEventId("questions", item.id));

    // Only one question is pinned at a time; unpinning the rest goes through
    // the view in pinQuestion so every screen hears it.
    return sql<Question>(`
      update questions
         set status = ${item.status},
             pinned = ${item.pinned},
             answered = ${item.answered}
       where id = ${item.id}
   returning *
    `).firstOrThrow();
  },

  delete: (item) => {
    requireHost(storedEventId("questions", item.id));
    questions.delete(item);
  },
});

export let questionVotes: LiveTable<QuestionVote> = new LiveTable<QuestionVote>({
  insert: (item) => {
    requireVoter(item.voterId);

    let open = sql(`
      select 1 from questions
       where id = ${item.questionId}
         and eventId = ${item.eventId}
         and status = 'live'
         and not answered
    `);

    if (open.empty()) {
      throw new ValidationError("That question is not taking votes.");
    }

    let voted = sql(`select 1 from questionVotes where questionId = ${item.questionId} and voterId = ${item.voterId}`);
    if (!voted.empty()) {
      throw new ValidationError("You already voted for this question.");
    }

    return questionVotes.insert({
      id: item.id,
      eventId: item.eventId,
      questionId: item.questionId,
      voterId: item.voterId,
    });
  },

  update: () => {
    throw new ForbiddenError();
  },

  delete: (item) => {
    requireVoter(item.voterId);

    let stored = sql<QuestionVote>(`select * from questionVotes where id = ${item.id}`).first();
    if (stored && stored.voterId !== item.voterId) {
      throw new ForbiddenError();
    }

    questionVotes.delete(item);
  },
});

export let polls: LiveTable<Poll> = new LiveTable<Poll>({
  insert: (item) => {
    requireHost(item.eventId!);

    let prompt = (item.prompt ?? "").trim();
    let options = (item.options ?? []).map((o) => o.trim()).filter(Boolean);

    if (!prompt) {
      throw new ValidationError("Write the poll question.");
    }

    if (item.kind === "choice" && options.length < 2) {
      throw new ValidationError("A multiple choice poll needs at least two options.");
    }

    return polls.insert({
      id: item.id,
      eventId: item.eventId,
      prompt,
      kind: item.kind === "words" ? "words" : "choice",
      options: item.kind === "words" ? [] : options,
      status: "draft",
    });
  },

  update: (item) => {
    requireHost(storedEventId("polls", item.id));

    return sql<Poll>(`
      update polls
         set status = ${item.status}
       where id = ${item.id}
   returning *
    `).firstOrThrow();
  },

  delete: (item) => {
    requireHost(storedEventId("polls", item.id));
    polls.delete(item);
  },
});

export let pollResponses: LiveTable<PollResponse> = new LiveTable<PollResponse>({
  insert: (item) => {
    requireVoter(item.voterId);

    let poll = sql<Poll>(`
      select * from polls
       where id = ${item.pollId}
         and eventId = ${item.eventId}
         and status = 'open'
    `).first();

    if (!poll) {
      throw new ValidationError("That poll is closed.");
    }

    let choice: number | null = null;
    let word: string | null = null;

    if (poll.kind === "choice") {
      if (item.choice == null || item.choice < 0 || item.choice >= poll.options.length) {
        throw new ValidationError("Pick one of the options.");
      }

      choice = item.choice;
    } else {
      word = normalizeWord(item.word ?? "");
      if (!word) {
        throw new ValidationError("Enter a word.");
      }
    }

    let taken = sql(`select 1 from pollResponses where pollId = ${poll.id} and voterId = ${item.voterId}`);
    if (!taken.empty()) {
      throw new ValidationError("You already answered this poll.");
    }

    return pollResponses.insert({
      id: item.id,
      eventId: item.eventId,
      pollId: poll.id,
      voterId: item.voterId,
      choice,
      word,
    });
  },

  update: () => {
    throw new ForbiddenError();
  },

  delete: () => {
    throw new ForbiddenError();
  },
});

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_WORD);
}

export function voteCounts(votes: LiveView<QuestionVote>): Map<string, number> {
  let counts = new Map<string, number>();
  for (let v of votes) {
    counts.set(v.questionId, (counts.get(v.questionId) ?? 0) + 1);
  }

  return counts;
}

/**
 * Pinned first, then most votes, then oldest, so two questions with the same
 * count keep a stable order as votes stream in.
 */
export function rankQuestions(list: Question[], counts: Map<string, number>): Question[] {
  return list.slice().sort((a, b) =>
    Number(b.pinned) - Number(a.pinned) ||
    (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
    +new Date(a.createdAt) - +new Date(b.createdAt),
  );
}

export interface Tally {
  label: string;
  count: number;
  share: number;
}

export function tallyChoices(poll: Poll, responses: LiveView<PollResponse>): Tally[] {
  let counts = poll.options.map(() => 0);
  for (let r of responses) {
    if (r.pollId === poll.id && r.choice != null && r.choice < counts.length) {
      counts[r.choice]++;
    }
  }

  let total = counts.reduce((a, b) => a + b, 0);

  return poll.options.map((label, i) => ({
    label,
    count: counts[i],
    share: total ? counts[i] / total : 0,
  }));
}

export interface CloudWord {
  id: string;
  word: string;
  count: number;
  weight: number;
}

export function tallyWords(poll: Poll, responses: LiveView<PollResponse>): CloudWord[] {
  let counts = new Map<string, number>();
  for (let r of responses) {
    if (r.pollId === poll.id && r.word) {
      counts.set(r.word, (counts.get(r.word) ?? 0) + 1);
    }
  }

  let max = Math.max(1, ...counts.values());

  // Alphabetical, so a word keeps its place in the cloud as counts change.
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([word, count]) => ({ id: word, word, count, weight: count / max }));
}

export function responseCount(poll: Poll, responses: LiveView<PollResponse>): number {
  return responses.filter((r) => r.pollId === poll.id).length;
}
