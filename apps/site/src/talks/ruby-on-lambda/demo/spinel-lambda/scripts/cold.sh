#!/usr/bin/env bash
# Any configuration change retires warm environments; the next request is a cold start.
source "$(dirname "$0")/common.sh"
aws_ lambda update-function-configuration --function-name "$FUNCTION" \
  --environment "Variables={COLD_NONCE=$(date +%s)}" --query LastUpdateStatus --output text
aws_ lambda wait function-updated-v2 --function-name "$FUNCTION"
"$(dirname "$0")/smoke.sh"
