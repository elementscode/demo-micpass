-- add micpass schema

create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table events (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  hostId uuid not null references users(id) on delete cascade,
  title text not null,
  code text not null unique,
  moderated boolean not null default false,
  showPollId uuid
);

create index eventsHostId on events (hostId);

create trigger eventsTouchUpdatedAt
  before update on events
  for each row execute function touchUpdatedAt();

-- status is pending (awaiting a moderator), live, or hidden
create table questions (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  eventId uuid not null references events(id) on delete cascade,
  body text not null,
  authorName text not null default '',
  askerId uuid not null,
  status text not null default 'live' check (status in ('pending', 'live', 'hidden')),
  pinned boolean not null default false,
  answered boolean not null default false
);

create index questionsEventId on questions (eventId);

create trigger questionsTouchUpdatedAt
  before update on questions
  for each row execute function touchUpdatedAt();

create table questionVotes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  eventId uuid not null references events(id) on delete cascade,
  questionId uuid not null references questions(id) on delete cascade,
  voterId uuid not null,
  unique (questionId, voterId)
);

create index questionVotesEventId on questionVotes (eventId);

create trigger questionVotesTouchUpdatedAt
  before update on questionVotes
  for each row execute function touchUpdatedAt();

-- kind is choice (multiple choice over options) or words (a word cloud);
-- status is draft, open, or closed
create table polls (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  eventId uuid not null references events(id) on delete cascade,
  prompt text not null,
  kind text not null check (kind in ('choice', 'words')),
  options text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'open', 'closed'))
);

create index pollsEventId on polls (eventId);

create trigger pollsTouchUpdatedAt
  before update on polls
  for each row execute function touchUpdatedAt();

alter table events
  add constraint eventsShowPollId foreign key (showPollId) references polls(id) on delete set null;

create table pollResponses (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  eventId uuid not null references events(id) on delete cascade,
  pollId uuid not null references polls(id) on delete cascade,
  voterId uuid not null,
  choice integer,
  word text,
  unique (pollId, voterId)
);

create index pollResponsesEventId on pollResponses (eventId);

create trigger pollResponsesTouchUpdatedAt
  before update on pollResponses
  for each row execute function touchUpdatedAt();
