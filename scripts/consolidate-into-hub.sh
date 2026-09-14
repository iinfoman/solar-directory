#!/usr/bin/env bash
#
# Move one Supabase project's public schema into a named schema on the hub project.
# See docs/supabase-consolidation.md for the plan this belongs to.
#
#   scripts/consolidate-into-hub.sh <source-conn-string> <hub-conn-string> <schema>
#
# Connection strings come from each project's dashboard under Connect → Session pooler.
# Nothing is written to the hub until you have read the rewritten SQL and confirmed.
# The source project is never modified: it stays intact as the rollback.

set -euo pipefail

SRC=${1:?source connection string}
HUB=${2:?hub connection string}
SCHEMA=${3:?target schema name, e.g. lavishwig}

case $SCHEMA in
  [a-z_][a-z0-9_]*) ;;
  *) echo "schema must be lower-case letters, digits and underscores: $SCHEMA" >&2; exit 1 ;;
esac

WORK=$(mktemp -d)
RAW=$WORK/raw.sql
OUT=$WORK/$SCHEMA.sql
trap 'echo "working files kept in $WORK"' EXIT

echo "==> dumping public schema from source"
pg_dump "$SRC" \
  --schema=public \
  --no-owner --no-privileges --no-publications --no-subscriptions \
  --quote-all-identifiers \
  -f "$RAW"

echo "==> rewriting public -> $SCHEMA"
# Only statement lines are rewritten. Lines inside a COPY block are row data and are
# passed through untouched, so a column whose value happens to contain "public." is safe.
awk -v schema="$SCHEMA" '
  function rewrite(line) {
    gsub(/"public"\./, "\"" schema "\".", line)
    gsub(/SCHEMA "public"/, "SCHEMA \"" schema "\"", line)
    gsub(/schema "public"/, "schema \"" schema "\"", line)
    return line
  }
  in_copy && /^\\\.$/ { in_copy = 0; print; next }   # end of row data
  in_copy             { print; next }                # row data, verbatim
  /^COPY .* FROM stdin;$/ { in_copy = 1; print rewrite($0); next }
  { print rewrite($0) }
' "$RAW" > "$OUT"

{
  echo "create schema if not exists \"$SCHEMA\";"
  cat "$OUT"
  cat <<GRANTS
grant usage on schema "$SCHEMA" to anon, authenticated, service_role;
grant all on all tables    in schema "$SCHEMA" to anon, authenticated, service_role;
grant all on all routines  in schema "$SCHEMA" to anon, authenticated, service_role;
grant all on all sequences in schema "$SCHEMA" to anon, authenticated, service_role;
alter default privileges for role postgres in schema "$SCHEMA"
  grant all on tables to anon, authenticated, service_role;
GRANTS
} > "$OUT.final"

echo
echo "==> $(grep -c '' "$OUT.final") lines written to $OUT.final"
grep -n 'public' "$OUT.final" && echo "^^ remaining references to public — check these are deliberate (auth.uid(), extensions, etc.)" || true
echo
read -r -p "Load this into the hub now? [y/N] " reply
[[ $reply == [yY] ]] || { echo "not loaded."; exit 0; }

echo "==> loading into hub"
psql "$HUB" --single-transaction --set ON_ERROR_STOP=1 -f "$OUT.final"

echo
echo "Done. Next:"
echo "  1. add '$SCHEMA' to Exposed schemas in the hub's API settings"
echo "  2. point that site's client at it:  createClient(url, key, { db: { schema: '$SCHEMA' } })"
echo "  3. verify the site, then delete the source project"
