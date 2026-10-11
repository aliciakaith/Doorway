-- Run once in the Supabase SQL editor.
-- One row per participant per item. Changing an answer updates the row (see api/responses.ts).

create table if not exists public.responses (
  participant_id        text        not null,
  item_id               text        not null,
  pair_id               text        not null,
  shown_order           integer     not null,
  judgement             text        not null check (judgement in ('agree', 'disagree')),
  comment               text        not null default '',
  time_on_item_seconds  integer     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  primary key (participant_id, item_id)
);

-- Row level security on, with no policies: the public anon key can neither read nor write.
-- Only the service role key, used server-side by api/responses.ts, can insert.
alter table public.responses enable row level security;

-- Already created the table before pair_id was added? Run this once instead of the create above:
-- alter table public.responses add column if not exists pair_id text not null default '';
