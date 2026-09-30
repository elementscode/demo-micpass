const VOTER_KEY = "micpass:voter";

const NAME_KEY = "micpass:name";

export interface Voter {
  id: string;
  name: string;
}

/**
 * The audience has no account, so the browser mints an id once and keeps it.
 * On the server render there is no storage; the page fills it in on attach.
 */
export function loadVoter(voter: Voter) {
  if (typeof localStorage === "undefined") {
    return;
  }

  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, id);
  }

  voter.id = id;
  voter.name = localStorage.getItem(NAME_KEY) ?? "";
}

export function saveName(name: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(NAME_KEY, name.trim());
  }
}
