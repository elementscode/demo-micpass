import { test, assert, Request, Response } from "@elements/app";
import route from "./index";

test("signin renders for a signed-out visitor", () => {
  assert(route({ params: {} } as unknown as Request, {} as Response) != null);
});
