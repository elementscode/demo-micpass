![Micpass, a live Q&A and polling app built with Elements: the host console for a Q3 all-hands, with audience questions ranked by votes, a pinned question, and an open poll's results updating as people vote.](TBD)

# Micpass

> A demo app built with [Elements](https://elements.dev).

Hosts open an event with a join code, the audience asks and upvotes questions and votes in polls, and a presenter screen shows the top questions or live results.

**Demo:** [Micpass](TBD)

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
