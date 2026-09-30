import { Request, Response, session } from "@elements/app";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({ signedIn: session.isLoggedIn() });
}
