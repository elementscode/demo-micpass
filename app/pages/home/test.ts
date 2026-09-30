import { test, assert, Request, Response } from "@elements/app";
import route from "./index";

test("home renders for a visitor", () => {
  assert(route({ params: {} } as unknown as Request, {} as Response) != null);
});
