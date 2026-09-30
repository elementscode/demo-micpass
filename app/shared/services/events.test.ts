import { test, assert, equal, sql } from "@elements/app";
import { askQuestion, findEvent, hostedEvent, normalizeCode } from "#app/shared/services/events";
import { makeHost, makeEvent, loginAs, VOTER_A } from "#app/shared/services/fixtures";

async function throws(fn: () => unknown | Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

test("events", () => {
  test("codes are case and space insensitive", () => {
    equal(normalizeCode(" all-hands "), "ALLHANDS");

    let event = makeEvent(makeHost("a"), "J");
    equal(findEvent(event.code.toLowerCase()), event.code);
  });

  test("an unknown code is refused", async () => {
    assert(await throws(() => findEvent("NOPE00")));
  });

  test("askQuestion waits for review in a moderated event", () => {
    let event = makeEvent(makeHost("b"), "M", true);
    let q = askQuestion(event.id, VOTER_A, { body: "What is next?", authorName: " Sam " });

    equal(q.status, "pending");
    equal(q.authorName, "Sam");
  });

  test("askQuestion goes live in an open event", () => {
    let event = makeEvent(makeHost("c"), "O");
    let q = askQuestion(event.id, VOTER_A, { body: "What is next?", authorName: "" });

    equal(q.status, "live");
    equal(sql<{ n: number }>(`select count(*)::int as n from questions where eventId = ${event.id}`).firstOrThrow().n, 1);
  });

  test("askQuestion needs a voter id", async () => {
    let event = makeEvent(makeHost("d"), "V");
    assert(await throws(() => askQuestion(event.id, "not-a-uuid", { body: "hi", authorName: "" })));
  });

  test("hostedEvent returns the host's own event", () => {
    let host = makeHost("e");
    let event = makeEvent(host, "H");
    loginAs(host);

    equal(hostedEvent(event.id)?.id, event.id);
  });

  test("hostedEvent hides another host's event", async () => {
    let event = makeEvent(makeHost("f"), "X");
    loginAs(makeHost("g"));

    assert(await throws(() => hostedEvent(event.id)));
  });
});
