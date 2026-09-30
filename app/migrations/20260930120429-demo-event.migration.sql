-- demo host, one all-hands with questions, votes and two finished polls
/** @env development */

insert into users (email, name, passwordHash)
     values ('host@micpass.dev', 'Riley Chen', crypt('micpass-demo', genSalt('bf', 12)));

insert into events (hostId, title, code, moderated)
     select id, 'Q3 All-Hands', 'ALLHANDS', true
       from users
      where email = 'host@micpass.dev';

create temporary table demoQuestions (
  n int,
  body text,
  authorName text,
  status text,
  pinned boolean,
  answered boolean,
  votes int,
  minutesAgo int
) on commit drop;

insert into demoQuestions (n, body, authorName, status, pinned, answered, votes, minutesAgo) values
  (1,  'When will the new pricing tiers ship to existing customers?',                       'Priya',  'live',    true,  false, 23, 41),
  (2,  'Are we still planning to hire in the Berlin office this year?',                     '',       'live',    false, false, 31, 38),
  (3,  'What is the plan for on-call load now that the platform team is smaller?',         'Marcus', 'live',    false, false, 27, 36),
  (4,  'Can we get a recording of this for the APAC team?',                                 'Aiko',   'live',    false, true,  18, 35),
  (5,  'How did the self-serve launch do against the targets we set in Q2?',               '',       'live',    false, false, 14, 30),
  (6,  'Will the offsite be in person this time?',                                          'Sam',    'live',    false, false, 12, 27),
  (7,  'What does success look like for the enterprise push by end of year?',              'Dana',   'live',    false, false, 9,  22),
  (8,  'Is there a timeline for the mobile app redesign?',                                  '',       'live',    false, true,  7,  20),
  (9,  'How are we thinking about AI features in the core product?',                        'Leo',    'live',    false, false, 21, 16),
  (10, 'Any update on the learning budget for next year?',                                  '',       'live',    false, false, 5,  11),
  (11, 'Could the leadership team share the board deck highlights?',                        'Nora',   'pending', false, false, 0,  4),
  (12, 'Why did we move the release freeze to December?',                                   '',       'pending', false, false, 0,  2),
  (13, 'buy my crypto course lol',                                                          '',       'hidden',  false, false, 0,  9);

insert into questions (id, eventId, body, authorName, askerId, status, pinned, answered, createdAt)
     select md5('question' || q.n)::uuid, e.id, q.body, q.authorName, md5('voter' || (100 + q.n))::uuid,
            q.status, q.pinned, q.answered, now() - make_interval(mins => q.minutesAgo)
       from demoQuestions q, events e
      where e.code = 'ALLHANDS';

insert into questionVotes (eventId, questionId, voterId)
     select e.id, md5('question' || q.n)::uuid, md5('voter' || v)::uuid
       from demoQuestions q
      cross join events e
      cross join generate_series(1, 40) v
      where e.code = 'ALLHANDS'
        and v <= q.votes;

insert into polls (id, eventId, prompt, kind, options, status, createdAt)
     select md5('poll1')::uuid, id, 'How confident are you in the Q4 roadmap?', 'choice',
            array['Very confident', 'Somewhat confident', 'Not sure yet', 'Worried'], 'closed',
            now() - interval '50 minutes'
       from events where code = 'ALLHANDS'
     union all
     select md5('poll2')::uuid, id, 'One word for this quarter', 'words',
            '{}', 'closed', now() - interval '45 minutes'
       from events where code = 'ALLHANDS'
     union all
     select md5('poll3')::uuid, id, 'Where should the winter offsite be?', 'choice',
            array['Lisbon', 'Mexico City', 'Montreal', 'Stay remote'], 'draft',
            now() - interval '40 minutes'
       from events where code = 'ALLHANDS';

-- choice weights: 14 very, 19 somewhat, 7 not sure, 3 worried
insert into pollResponses (eventId, pollId, voterId, choice)
     select e.id, md5('poll1')::uuid, md5('voter' || v)::uuid,
            case when v <= 14 then 0 when v <= 33 then 1 when v <= 40 then 2 else 3 end
       from events e, generate_series(1, 43) v
      where e.code = 'ALLHANDS';

insert into pollResponses (eventId, pollId, voterId, word)
     select e.id, md5('poll2')::uuid, md5('voter' || w.n)::uuid, w.word
       from events e,
            (values (1, 'shipping'), (2, 'shipping'), (3, 'shipping'), (4, 'shipping'), (5, 'shipping'),
                    (6, 'shipping'), (7, 'shipping'), (8, 'busy'), (9, 'busy'), (10, 'busy'),
                    (11, 'busy'), (12, 'busy'), (13, 'growth'), (14, 'growth'), (15, 'growth'),
                    (16, 'growth'), (17, 'focused'), (18, 'focused'), (19, 'focused'), (20, 'chaotic'),
                    (21, 'chaotic'), (22, 'chaotic'), (23, 'momentum'), (24, 'momentum'), (25, 'exciting'),
                    (26, 'exciting'), (27, 'hiring'), (28, 'learning'), (29, 'sprint'), (30, 'rebuild'),
                    (31, 'customers'), (32, 'customers'), (33, 'tired'), (34, 'scrappy'), (35, 'launch'),
                    (36, 'launch'), (37, 'launch')) as w (n, word)
      where e.code = 'ALLHANDS';
