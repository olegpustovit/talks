#!/usr/bin/env bash
# Idempotent: role -> function (create or update code+config) -> public URL -> endpoint.json
source "$(dirname "$0")/common.sh"
ZIP=${1:?usage: deploy.sh build/function.zip}

# 1. execution role: trust lambda.amazonaws.com, only AWSLambdaBasicExecutionRole (CloudWatch Logs)
TRUST='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
if ROLE_ARN=$(iam_ iam get-role --role-name "$ROLE" --query Role.Arn --output text 2>/dev/null); then
  echo "role: exists $ROLE_ARN"
  NEW_ROLE=0
else
  ROLE_ARN=$(iam_ iam create-role --role-name "$ROLE" --assume-role-policy-document "$TRUST" \
    --description "Execution role for $FUNCTION (RubyZG talk demo)" \
    --tags Key=project,Value=rubyzg-talk --query Role.Arn --output text)
  echo "role: created $ROLE_ARN"
  NEW_ROLE=1
fi
iam_ iam attach-role-policy --role-name "$ROLE" \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 2. function
if aws_ lambda get-function --function-name "$FUNCTION" >/dev/null 2>&1; then
  echo "function: updating code"
  aws_ lambda update-function-code --function-name "$FUNCTION" --zip-file "fileb://$ZIP" \
    --architectures "$ARCH" --query '{size:CodeSize,sha:CodeSha256}' --output text
  aws_ lambda wait function-updated-v2 --function-name "$FUNCTION"
  aws_ lambda update-function-configuration --function-name "$FUNCTION" --memory-size "$MEMORY" \
    --timeout 10 --runtime provided.al2023 --handler bootstrap --role "$ROLE_ARN" \
    --query LastUpdateStatus --output text
  aws_ lambda wait function-updated-v2 --function-name "$FUNCTION"
else
  echo "function: creating"
  # A brand-new role takes a few seconds to become assumable by Lambda.
  for i in $(seq 1 12); do
    if aws_ lambda create-function --function-name "$FUNCTION" --runtime provided.al2023 \
        --architectures "$ARCH" --handler bootstrap --role "$ROLE_ARN" --memory-size "$MEMORY" \
        --timeout 10 --zip-file "fileb://$ZIP" --tags "$TAGS_KV" \
        --description "Ruby compiled AOT by Spinel; RubyZG talk demo" \
        --query FunctionArn --output text 2>/tmp/spinel-create.err; then break; fi
    if grep -q "cannot be assumed" /tmp/spinel-create.err; then echo "  role not ready, retry $i"; sleep 5; else cat /tmp/spinel-create.err >&2; exit 1; fi
  done
  aws_ lambda wait function-active-v2 --function-name "$FUNCTION"
fi

# 3. public Function URL (AuthType NONE) + both resource-policy statements AWS requires
#    since Oct 2025: lambda:InvokeFunctionUrl (FunctionUrlAuthType=NONE) and
#    lambda:InvokeFunction (InvokedViaFunctionUrl=true).
#    https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
if ! URL=$(aws_ lambda get-function-url-config --function-name "$FUNCTION" --query FunctionUrl --output text 2>/dev/null); then
  URL=$(aws_ lambda create-function-url-config --function-name "$FUNCTION" --auth-type NONE \
    --query FunctionUrl --output text)
  echo "url: created $URL"
else
  aws_ lambda update-function-url-config --function-name "$FUNCTION" --auth-type NONE >/dev/null
  echo "url: exists $URL"
fi
POLICY=$(aws_ lambda get-policy --function-name "$FUNCTION" --query Policy --output text 2>/dev/null || echo '{}')
if ! grep -q '"Sid":"FunctionURLAllowPublicAccess"' <<<"$POLICY"; then
  aws_ lambda add-permission --function-name "$FUNCTION" --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl --principal '*' --function-url-auth-type NONE >/dev/null
  echo "policy: added lambda:InvokeFunctionUrl"
fi
if ! grep -q '"Sid":"FunctionURLInvokeAllowPublicAccess"' <<<"$POLICY"; then
  aws_ lambda add-permission --function-name "$FUNCTION" --statement-id FunctionURLInvokeAllowPublicAccess \
    --action lambda:InvokeFunction --principal '*' --invoked-via-function-url >/dev/null
  echo "policy: added lambda:InvokeFunction (InvokedViaFunctionUrl)"
fi

# 4. endpoint.json for the slide
printf '{\n  "url": "%s",\n  "function": "%s",\n  "region": "%s",\n  "deployedAt": "%s"\n}\n' \
  "$URL" "$FUNCTION" "$REGION" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$HERE/endpoint.json"
echo "wrote endpoint.json -> $URL"
