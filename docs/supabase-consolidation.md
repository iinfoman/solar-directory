# Supabase: one Pro org, one project, a schema per site

## Why

The org `iinfoman's Org` is on the Free plan, which allows **two active projects**;
everything else is paused after ~7 days of low activity. There are nine projects:

| Project | Ref | Region | State | Contents |
|---|---|---|---|---|
| SolarinstallersSA | `alogcohoopgzerrxheiw` | eu-west-1 | paused | installers, ads, settings, reviews — **the only real data** |
| meshstage | `mokkdnezaumgryyentib` | eu-west-1 | active | 2 tables, 0 rows |
| Ovibe | `bicpbpasvtvqisatiiqd` | eu-north-1 | active | 5 tables, 0 rows |
| hire in capetown | `adexrspbgcsnumcgpzgq` | us-east-2 | paused | — |
| Jeancleaners | `mirikjdidtpbkrfijzpn` | eu-west-1 | paused | — |
| lavish-wig | `mlxaeuubgladpumsixfz` | eu-west-1 | paused | — |
| website2go | `inejgrgvftqjdxqowwoc` | us-east-2 | paused | — |
| idea 2 cash | `eossetykjmideendmvsh` | us-east-2 | paused | — |
| Perfect present Persona | `hballwwdcwwseaomnnzq` | us-east-2 | paused | — |

The two active slots are held by projects with **no rows in them**, while the site
that is actually published is the one that got paused. Rotating pauses by hand is
what has been happening; this document replaces that.

## The shape

**Upgrade the org to Pro, then run every site out of a single project, one schema per
site.** Pro removes pausing entirely. Compute is billed per *project*, so the saving
comes from collapsing nine projects into one — Pro alone, with nine projects still
running, would be the expensive way to solve this.

```
Pro org
└── project "hub"  (eu-west-1, was SolarinstallersSA)
    ├── schema solar        → solardirectorysa.co.za
    ├── schema hireincpt    → hireincapetown
    ├── schema ovibe        → Ovibe
    ├── schema meshstage    → MeshStage
    ├── schema lavishwig    → lavish-wig
    ├── schema jeancleaners → Jeancleaners
    ├── schema website2go   → website2go
    ├── schema idea2cash    → idea 2 cash
    └── schema persona      → Perfect present Persona
```

### Cost

Pro is $25/mo per org, plus ~$10/mo per active project, with $10 of compute credits
included — so the first project is covered by the subscription.

| Setup | Monthly |
|---|---|
| Pro, 1 project (this plan) | **$25** |
| Pro, 2 projects | $35 |
| Pro, all 9 projects kept separate | ~$105 |

Compute is billed hourly, so the migration window itself — where several projects are
briefly running at once — costs cents, not a month of each.

## What you give up

Worth knowing before committing, because none of these are reversible for free later:

- **One auth pool.** `auth.users` is per project, not per schema. Everyone who signs up
  on any of these sites lands in the same user table, and a token issued by one site is
  a valid token at the others' API. Fine for the admin-only sites here (solar's policies
  key off `auth.jwt() ->> 'email'`, which still works), but any site that grows real
  end-user accounts should be moved back out to its own project.
- **One storage namespace.** Buckets are per project. Prefix them per site
  (`solar-directory-assets`, not `directory-assets`) so two sites can't collide.
- **Edge functions and realtime channels share a namespace too** — same prefix rule.
- **One region for everything.** eu-west-1 (Ireland) is the pick: closest of the
  available regions to South African traffic, and where solar already lives.
- **Blast radius.** One bad migration touches every site. Hence the order below.

## Migration

The hub is the existing **SolarinstallersSA** project, renamed. It is already in
eu-west-1 on Postgres 17.6, and it holds the only data that matters, so choosing it
means the riskiest data never moves across a dump/restore at all.

### 1. Upgrade the org (you, in the dashboard)

Billing settings → Subscription plan → Pro. All paused projects can then be restored
and none will pause again.

### 2. Move solar's own tables into a `solar` schema

In-place, no dump, seconds:

```sql
create schema if not exists solar;
alter table public.installers set schema solar;
alter table public.ads        set schema solar;
alter table public.settings   set schema solar;
alter table public.reviews    set schema solar;
alter view  public.installer_ratings set schema solar;
```

RLS policies, triggers, indexes and constraints follow their table automatically.

### 3. Expose the schema

Dashboard → API settings → **Exposed schemas**: add `solar` (leave `public` first in the
list so nothing that still points at `public` breaks), then:

```sql
grant usage on schema solar to anon, authenticated, service_role;
grant all on all tables     in schema solar to anon, authenticated, service_role;
grant all on all routines   in schema solar to anon, authenticated, service_role;
grant all on all sequences  in schema solar to anon, authenticated, service_role;
alter default privileges for role postgres in schema solar
  grant all on tables to anon, authenticated, service_role;
```

### 4. Point the site at it

One line in `site/index.html` and `site/admin.html`:

```js
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'solar' }
});
```

### 5. Bring the other sites in, one at a time

`scripts/consolidate-into-hub.sh` does the dump → schema rewrite → load for one project.
Run them in this order, verifying the site after each:

1. meshstage, Ovibe (empty — proves the pipeline with nothing at stake)
2. idea 2 cash, Perfect present Persona, website2go (not published)
3. Jeancleaners, lavish-wig, hire in capetown (published; check each one renders)

Delete a source project only once its site has been verified against the hub, and keep
the dump file until then — it is the rollback.

## Rollback

Every step is reversible: `alter table solar.x set schema public` undoes step 2, the
client change is one line, and each migrated project stays intact until deleted.
