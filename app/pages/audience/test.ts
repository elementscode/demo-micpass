import { test, assert, Request, Response } from "@elements/app";
import { makeHost, makeEvent } from "#app/shared/services/fixtures";
import route from "./index";

async function throws(fn: () => unknown | Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

test("audience", () => {
  test("renders for a known code, in any case", () => {
    let event = makeEvent(makeHost("aud"), "A");
    let page = route({ params: { code: event.code.toLowerCase() } } as unknown as Request, {} as Response);

    assert(page != null);
  });

  test("an unknown code is a 404", async () => {
    assert(await throws(() => route({ params: { code: "NOPE" } } as unknown as Request, {} as Response)));
  });
});
