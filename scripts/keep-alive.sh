#!/bin/bash

# Supabase Keep-Alive Script
# Hace una query simple para evitar que el proyecto se pause por inactividad.
# Ejecutar manualmente o via cron cada 5-6 días.

SUPABASE_URL="https://jwbtvsoumeavehgdnhau.supabase.co"
ANON_KEY="sb_publishable_WZgDs1C051ITntuUKcziKg_ZURq8yqA"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pinging Supabase..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/recipes?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY")

if [ "$RESPONSE" -eq 200 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ OK — proyecto activo (HTTP $RESPONSE)"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR — respuesta inesperada (HTTP $RESPONSE)"
  exit 1
fi
