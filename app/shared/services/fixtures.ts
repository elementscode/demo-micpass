import { session, sql } from "@elements/app";
import { MicEvent } from "#app/shared/services/live";

export interface TestHost {
  id: string;
  name: string;
}

/** Cost 4, not 12: tests never need a slow hash. */
// Top-level tests run concurrently, so emails and codes are unique per call
// rather than per test: two open transactions inserting one value block.
export function makeHost(label: string): TestHost {
  let email = `${label}.${crypto.randomUUID()}@test.dev`;

  return sql<TestHost>(`
    insert into users (email, name, passwordHash)
         values (${email}, 'Test Host', crypt('password1', genSalt('bf', 4)))
      returning id, name
  `).firstOrThrow();
}

export function loginAs(host: TestHost) {
  session.login({ userId: host.id, userName: host.name });
}

export function makeEvent(host: TestHost, label: string, moderated = false): MicEvent {
  let code = `${label}${crypto.randomUUID().slice(0, 8)}`.toUpperCase();

  return sql<MicEvent>(`
    insert into events (hostId, title, code, moderated)
         values (${host.id}, 'Test event', ${code}, ${moderated})
      returning *
  `).firstOrThrow();
}

export const VOTER_A = "00000000-0000-4000-8000-00000000000a";

export const VOTER_B = "00000000-0000-4000-8000-00000000000b";
