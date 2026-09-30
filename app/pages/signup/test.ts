import { test, assert, Request, Response } from "@elements/app";
import route from "./index";

test("signup renders for a signed-out visitor", () => {
  assert(route({ params: {} } as unknown as Request, {} as Response) != null);
});
