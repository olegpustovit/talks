#!/usr/bin/env bash
# REPORT lines from the last hour, one per invocation. "Init Duration" appears only on cold starts.
source "$(dirname "$0")/common.sh"
SINCE=$(( ($(date +%s) - ${SINCE_SECONDS:-3600}) * 1000 ))
aws_ logs filter-log-events --log-group-name "/aws/lambda/$FUNCTION" --start-time "$SINCE" \
  --filter-pattern '"REPORT RequestId"' --output json \
  | ruby -rjson -e 'JSON.parse(STDIN.read)["events"].each { |e| puts e["message"].strip.sub("REPORT RequestId: ", "").gsub(/\t/, "  ") }' \
  | tail -n "${N:-20}"
