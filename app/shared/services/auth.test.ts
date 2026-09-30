import { test, assert, equal, session, sql } from "@elements/app";
import { signin } from "#app/shared/services/auth";

async function throws(fn: () => unknown | Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}

test("signin", () => {
  test("the right password signs in", () => {
    sql(`
      insert into users (email, name, passwordHash)
           values ('ada@test.dev', 'Ada', crypt('correct-horse', genSalt('bf', 4)))
    `);

    signin(" ADA@test.dev ", "correct-horse");
    equal(session.get("userName"), "Ada");
  });

  test("the wrong password is refused", async () => {
    sql(`
      insert into users (email, name, passwordHash)
           values ('ada@test.dev', 'Ada', crypt('correct-horse', genSalt('bf', 4)))
    `);

    assert(await throws(() => signin("ada@test.dev", "wrong")));
  });

  test("an unknown email is refused", async () => {
    assert(await throws(() => signin("nobody@test.dev", "whatever")));
  });
});
