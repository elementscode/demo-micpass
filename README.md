![Live Q&A and polls for events, built by Claude Code on Elements: the host console for a Q3 all-hands, with audience questions ranked by votes, a pinned question, and an open poll's results updating as people vote.](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a/poster?v=349ce0c2dc82)

# Live Q&A and polls for events, built by Claude Code on Elements

> Micpass is a full-stack app built with Claude Code on Elements.

Join codes, audience questions ranked by upvotes, live polls and word clouds, and a presenter screen for the projector.

[Run this app on your machine](https://elements.dev/demos/01a0f3c8-b03e-7fa7-84c4-5f186a0fe28a). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Micpass needed questions, votes and poll results that move on every phone and the projector at once, moderation for the host, and an audience that joins with a code and no account. Each of those is a part of Elements, so the agent spent its 20 minutes on the Q&A app itself.

- **Live questions, votes and polls.** Events, questions, votes, polls and answers are LiveTables, so a vote reorders the questions and a poll answer grows its bar on every phone and the projector the moment it is cast.

- **Votes straight from the page.** The audience upvotes and answers polls by writing to the live tables, and the server checks each write: one vote per question, one answer per poll, only on a live question or an open poll.

- **Moderation.** Only the event's host approves, hides, pins or marks a question answered, and a moderated event holds new questions until the host approves them.

- **Server calls as function calls.** Creating an event mints a short join code, joining turns a typed code into the event page, and asking a question is one more `@rpc` call.

- **An audience with no account.** Each browser keeps its own voter id, which the server uses to count one vote per person.

- **Data from SQL files.** Migrations define the app and seed a host and one event with 13 questions, 167 votes, two finished polls and a draft poll ready to open.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
