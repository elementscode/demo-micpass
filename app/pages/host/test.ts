import { test, assert, Request, Response } from "@elements/app";
import { makeHost, loginAs } from "#app/shared/services/fixtures";
import route from "./index";

test("host", () => {
  test("renders for a signed-in host", () => {
    loginAs(makeHost("dash"));

    assert(route({ params: {} } as unknown as Request, {} as Response) != null);
  });
});
