import { test, assert, Request, Response } from "@elements/app";
import { makeHost, makeEvent, loginAs } from "#app/shared/services/fixtures";
import route from "./index";

async function throws(fn: () => unknown | Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

function request(id: string): Request {
  return { params: { id }, headers: { host: "localhost" } } as unknown as Request;
}

test("present", () => {
  test("renders for the event's host", () => {
    let host = makeHost("owner");
    let event = makeEvent(host, "E");
    loginAs(host);

    assert(route(request(event.id), {} as Response) != null);
  });

  test("another host gets a 404", async () => {
    let event = makeEvent(makeHost("owner"), "E");
    loginAs(makeHost("other"));

    assert(await throws(() => route(request(event.id), {} as Response)));
  });
});
