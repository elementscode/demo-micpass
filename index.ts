import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import host from "#app/pages/host";
import hostEvent from "#app/pages/host-event";
import present from "#app/pages/present";
import audience from "#app/pages/audience";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";

const app = new App();

app.route("/", home);
app.route("/signin", signin);
app.route("/signup", signup);
app.route("/host", host);
app.route("/host/events/:id", hostEvent);
app.route("/host/events/:id/present", present);
app.route("/e/:code", audience);

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
