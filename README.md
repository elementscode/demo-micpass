![Micpass, a live Q&A and polling app built with Elements: the host console for a Q3 all-hands, with audience questions ranked by votes, a pinned question, and an open poll's results updating as people vote.](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a/poster?v=349ce0c2dc82)

# Micpass

> A demo app built with [Elements](https://elements.dev).

Join codes, audience questions ranked by upvotes, live polls and word clouds, and a presenter screen for the projector.

**Demo:** [Micpass](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a)

## Agent specs

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

- **Live questions, votes and polls.** Events, questions, votes, polls and answers are LiveTables, so a vote reorders the questions and a poll answer grows its bar on every phone and the projector the moment it is cast.

- **Votes straight from the page.** The audience upvotes and answers polls by writing to the live tables, and the server checks each write: one vote per question, one answer per poll, only on a live question or an open poll.

- **Moderation.** Only the event's host approves, hides, pins or marks a question answered, and a moderated event holds new questions until the host approves them.

- **Server calls as function calls.** Creating an event mints a short join code, joining turns a typed code into the event page, and asking a question is one more `@rpc` call.

- **An audience with no account.** Each browser keeps its own voter id, which the server uses to count one vote per person.

- **Data from SQL files.** Migrations define the app and seed a host and one event with 13 questions, 167 votes, two finished polls and a draft poll ready to open.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 49 tests pass. Every page works on desktop and phone.

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

**Demo:** [Micpass](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a)

## License

MIT. See [LICENSE](LICENSE).
