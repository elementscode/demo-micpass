![Micpass, a live Q&A and polling app built with Elements: the host console for a Q3 all-hands, with audience questions ranked by votes, a pinned question, and an open poll's results updating as people vote.](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a/poster?v=349ce0c2dc82)

# Micpass

> A demo app built with [Elements](https://elements.dev).

Join codes, audience questions ranked by upvotes, live polls and word clouds, and a presenter screen for the projector.

**Demo:** [Micpass](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 20 min
- **Cost:** $6.96 at API rates, September 2026

## Get started

```bash
elements create micpass -scaffold=elementscode/demo-micpass
```

## How it's built

Micpass needed questions, votes and poll results that move on every phone and the projector at once, moderation for the host, and an audience that joins with a code and no account. Each of those is a part of Elements, so the agent spent its 20 minutes on the Q&A app itself.

### What Elements gave the app

- **Live questions, votes and polls.** `events`, `questions`, `questionVotes`, `polls` and `pollResponses` are five LiveTables in `app/shared/services/live.ts`. The audience page, the host console and the presenter screen each open views of them by event, so a vote reorders the list and a poll answer grows its bar on every screen the moment it is cast.
- **Writes straight from the page.** The audience upvotes and answers polls by writing to the views. The insert handlers do the checking: one vote per question, one answer per poll, only on a live question or an open poll, with word cloud answers trimmed and lowercased.
- **Moderation in the handlers.** The `questions` update handler lets only the event's host approve, hide, pin or mark a question answered, and it checks the stored row's event, not the one the browser sent. A moderated event holds new questions as pending until the host approves them.
- **Server calls as function calls.** `createEvent` in `app/shared/services/events.ts` is an `@rpc` that mints a short join code, `findEvent` turns a typed code into the audience page at `/e/:code`, and `askQuestion` posts a question.
- **An audience with no account.** `app/shared/services/voter.ts` gives each browser a voter id it keeps, which the handlers use to count one vote per person.
- **Data from SQL files.** Two migrations define the app and seed a host and one event with 13 questions, 167 votes, two finished polls with 80 responses between them and a draft poll ready to open.

### What the agent got from the tooling

The agent ran 27 builds in 20 minutes. By the build's own timer, the median build finished in 52 milliseconds, so it checked each edit and kept going. The build caught errors in four of them, among them a string passed where a `Filter` belonged and a test callback missing a Promise return type, each with a message that named the fix. It read 48 manual topics as it went, from `livetable/partitions` to `recipes/likes-toggle` and `style/components/tabs`, then wrote 49 tests and checked its pages in a real browser, including at phone width.

Start in `app/shared/services/live.ts`.

## Seed data and demo account

The seed creates one host and one event, "Q3 All-Hands", with the join code
`ALLHANDS`. It has 13 questions (two waiting for review, two answered, one
hidden, one pinned) with 167 votes, two finished polls (a multiple choice poll
with 43 responses and a word cloud with 37), and a draft poll ready to open
live.

| Email              | Password       | Role |
| ------------------ | -------------- | ---- |
| host@micpass.dev   | `micpass-demo` | host |

The sign-in page shows the login with a one-click button. The audience needs
no account: open the home page, enter `ALLHANDS`, and ask, upvote and vote.
The presenter screen is a link in the host console.

## The prompt

```text
Build a live Q&A and polling app named micpass for talks and all-hands meetings.

HOST (accounts)
- Create an event with a short join code.
- Presenter screen for the projector: the top questions, or the current poll's
  results as bars.
- Moderate: approve, hide, pin and mark questions answered.
- Run polls: multiple choice or word cloud, open and close them.

AUDIENCE (no account)
- Join with the code, optionally give a name.
- Ask a question and upvote others'. Questions sort by votes.
- Vote in the open poll.

Seed a host with one event full of questions and votes and two finished polls.
Show the host login on the sign-in page.

Questions, votes and poll results update in real time on every screen.
```

## License

MIT. See [LICENSE](LICENSE).
