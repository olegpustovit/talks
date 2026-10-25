#!/usr/bin/env bash
# Delete everything deploy.sh created. Safe to re-run: missing resources are skipped.
source "$(dirname "$0")/common.sh"
set +e
aws_ lambda delete-function-url-config --function-name "$FUNCTION" 2>/dev/null && echo "deleted function URL"
aws_ lambda delete-function --function-name "$FUNCTION" 2>/dev/null && echo "deleted function $FUNCTION"
iam_ iam detach-role-policy --role-name "$ROLE" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null && echo "detached policy"
iam_ iam delete-role --role-name "$ROLE" 2>/dev/null && echo "deleted role $ROLE"
aws_ logs delete-log-group --log-group-name "/aws/lambda/$FUNCTION" 2>/dev/null && echo "deleted log group"
rm -f "$HERE/endpoint.json"
echo "teardown done"
