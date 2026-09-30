import { test, assert, equal, sql } from "@elements/app";
import {
  Question,
  events,
  questions,
  questionVotes,
  polls,
  pollResponses,
  normalizeWord,
  rankQuestions,
} from "#app/shared/services/live";
import { makeHost, makeEvent, loginAs, VOTER_A, VOTER_B } from "#app/shared/services/fixtures";

async function throws(fn: () => unknown | Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

test("questions", () => {
  test("an audience question is live in an open event and pending in a moderated one", () => {
    let host = makeHost("a@test.dev");
    let open = makeEvent(host, "OPEN01");
    let moderated = makeEvent(host, "MODR01", true);

    let q1 = questions.view({ eventId: open.id }).insert({ body: "  hello?  ", askerId: VOTER_A });
    let q2 = questions.view({ eventId: moderated.id }).insert({ body: "hi", askerId: VOTER_A });

    equal(q1.status, "live");
    equal(q1.body, "hello?");
    equal(q2.status, "pending");
  });

  test("an anonymous caller cannot approve or pin", async () => {
    let host = makeHost("b@test.dev");
    let event = makeEvent(host, "PIN001", true);
    let view = questions.view({ eventId: event.id });
    let q = view.insert({ body: "hi", askerId: VOTER_A });

    assert(await throws(() => view.update({ ...q, status: "live", pinned: true })), "anonymous update refused");
  });

  test("the host approves and pins", () => {
    let host = makeHost("c@test.dev");
    let event = makeEvent(host, "HOST01", true);
    let view = questions.view({ eventId: event.id });
    let q = view.insert({ body: "hi", askerId: VOTER_A });

    loginAs(host);
    view.update({ ...q, status: "live", pinned: true });

    let stored = sql<Question>(`select * from questions where id = ${q.id}`).firstOrThrow();
    equal(stored.status, "live");
    equal(stored.pinned, true);
  });

  test("another host cannot moderate the event", async () => {
    let owner = makeHost("d@test.dev");
    let other = makeHost("e@test.dev");
    let event = makeEvent(owner, "OWNR01");
    let view = questions.view({ eventId: event.id });
    let q = view.insert({ body: "hi", askerId: VOTER_A });

    loginAs(other);
    assert(await throws(() => view.update({ ...q, status: "hidden" })), "other host refused");
  });

  test("an empty question is refused", async () => {
    let host = makeHost("f@test.dev");
    let event = makeEvent(host, "EMPT01");

    assert(await throws(() => questions.view({ eventId: event.id }).insert({ body: "   ", askerId: VOTER_A })));
  });

});

test("votes", () => {
  test("one vote per voter per question, only on live questions", () => {
    let host = makeHost("g@test.dev");
    let event = makeEvent(host, "VOTE01");
    let q = questions.view({ eventId: event.id }).insert({ body: "hi", askerId: VOTER_A });
    let votes = questionVotes.view({ eventId: event.id });

    votes.insert({ questionId: q.id, voterId: VOTER_A });
    votes.insert({ questionId: q.id, voterId: VOTER_B });

    let n = sql<{ n: number }>(`select count(*)::int as n from questionVotes where questionId = ${q.id}`).firstOrThrow().n;
    equal(n, 2);
  });

  test("a second vote from the same voter is refused", async () => {
    let host = makeHost("g@test.dev");
    let event = makeEvent(host, "VOTE01");
    let q = questions.view({ eventId: event.id }).insert({ body: "hi", askerId: VOTER_A });
    sql(`insert into questionVotes (eventId, questionId, voterId) values (${event.id}, ${q.id}, ${VOTER_A})`);

    assert(await throws(() => questionVotes.view({ eventId: event.id }).insert({ questionId: q.id, voterId: VOTER_A })));
  });

  test("a pending question takes no votes", async () => {
    let host = makeHost("h@test.dev");
    let event = makeEvent(host, "VOTE02", true);
    let q = questions.view({ eventId: event.id }).insert({ body: "hi", askerId: VOTER_A });

    assert(await throws(() => questionVotes.view({ eventId: event.id }).insert({ questionId: q.id, voterId: VOTER_B })));
  });

  test("a voter cannot remove someone else's vote", async () => {
    let host = makeHost("i@test.dev");
    let event = makeEvent(host, "VOTE03");
    let q = questions.view({ eventId: event.id }).insert({ body: "hi", askerId: VOTER_A });
    let votes = questionVotes.view({ eventId: event.id });
    let vote = votes.insert({ questionId: q.id, voterId: VOTER_A });

    assert(await throws(() => votes.delete({ ...vote, voterId: VOTER_B })));
  });

});

test("polls", () => {
  test("an anonymous caller cannot create a poll", async () => {
    let host = makeHost("j@test.dev");
    let event = makeEvent(host, "POLL01");

    assert(await throws(() => polls.view({ eventId: event.id }).insert({ prompt: "Q?", kind: "choice", options: ["a", "b"] })));
  });

  test("the host creates a draft poll", () => {
    let host = makeHost("j@test.dev");
    let event = makeEvent(host, "POLL01");
    let view = polls.view({ eventId: event.id });

    loginAs(host);
    let poll = view.insert({ prompt: "Q?", kind: "choice", options: ["a", " ", "b"] });
    equal(poll.status, "draft");
    equal(poll.options, ["a", "b"]);
  });

});

function choicePoll(email: string, code: string, status: "draft" | "open") {
  let host = makeHost(email);
  let event = makeEvent(host, code);
  loginAs(host);

  let view = polls.view({ eventId: event.id });
  let poll = view.insert({ prompt: "Q?", kind: "choice", options: ["a", "b"] });
  if (status === "open") {
    view.update({ ...poll, status: "open" });
  }

  return { poll, responses: pollResponses.view({ eventId: event.id }) };
}

test("poll responses", () => {
  test("a draft poll takes no answers", async () => {
    let { poll, responses } = choicePoll("k@test.dev", "POLL02", "draft");

    assert(await throws(() => responses.insert({ pollId: poll.id, voterId: VOTER_A, choice: 0 })));
  });

  test("a choice must be one of the options", async () => {
    let { poll, responses } = choicePoll("k@test.dev", "POLL02", "open");

    assert(await throws(() => responses.insert({ pollId: poll.id, voterId: VOTER_A, choice: 5 })));
  });

  test("one answer per voter", async () => {
    let { poll, responses } = choicePoll("k@test.dev", "POLL02", "open");

    sql(`insert into pollResponses (eventId, pollId, voterId, choice) values (${poll.eventId}, ${poll.id}, ${VOTER_A}, 1)`);

    assert(await throws(() => responses.insert({ pollId: poll.id, voterId: VOTER_A, choice: 0 })));
  });

  test("word answers are normalized", () => {
    let host = makeHost("l@test.dev");
    let event = makeEvent(host, "POLL03");
    loginAs(host);

    let view = polls.view({ eventId: event.id });
    let poll = view.insert({ prompt: "One word", kind: "words", options: [] });
    view.update({ ...poll, status: "open" });

    let r = pollResponses.view({ eventId: event.id }).insert({ pollId: poll.id, voterId: VOTER_A, word: "  Shipping  IT " });
    equal(r.word, "shipping it");
  });

  test("showing a poll on screen is the host's call", async () => {
    let host = makeHost("m@test.dev");
    let event = makeEvent(host, "POLL04");
    let view = events.view({ id: event.id });

    assert(await throws(() => view.update({ ...event, showPollId: null, title: "hijack" })));
  });

});

test("helpers", () => {
  test("pinned first, then votes, then oldest", () => {
    let base = { eventId: "e", authorName: "", askerId: "", status: "live" as const, answered: false };
    let list: Question[] = [
      { ...base, id: "a", body: "a", pinned: false, createdAt: new Date(1000) },
      { ...base, id: "b", body: "b", pinned: false, createdAt: new Date(2000) },
      { ...base, id: "c", body: "c", pinned: true, createdAt: new Date(3000) },
      { ...base, id: "d", body: "d", pinned: false, createdAt: new Date(500) },
    ];

    let counts = new Map([["a", 3], ["b", 5], ["d", 3]]);
    equal(rankQuestions(list, counts).map((q) => q.id), ["c", "b", "d", "a"]);
  });

  test("normalizeWord", () => {
    equal(normalizeWord("  Hello   World "), "hello world");
    equal(normalizeWord("x".repeat(40)).length, 24);
  });

});