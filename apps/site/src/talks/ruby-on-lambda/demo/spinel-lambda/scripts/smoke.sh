#!/usr/bin/env bash
# curl the Function URL: status, timing, iframe-relevant headers, and the live facts.
source "$(dirname "$0")/common.sh"
URL=$(sed -n 's/.*"url": "\(.*\)".*/\1/p' "$HERE/endpoint.json")
OUT=$(mktemp)
curl -sS -D "$OUT.h" -o "$OUT" -w 'HTTP %{http_code}  %{time_total}s  %{size_download} bytes\n' "$URL"
grep -i -E '^(content-type|x-frame-options|content-security-policy|x-amzn-requestid)' "$OUT.h" || true
grep -o '<b class="\(coral\|accent\)">[A-Z ]*</b><span>[^<]*' "$OUT" | sed 's/<[^>]*>/ /g'
grep -o '<span>Ruby work</span><b[^>]*>[^<]*' "$OUT" | sed 's/<[^>]*>/ /g'
rm -f "$OUT" "$OUT.h"
