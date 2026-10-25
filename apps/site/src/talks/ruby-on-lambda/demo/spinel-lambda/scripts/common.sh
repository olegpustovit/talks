# Shared settings for the deploy scripts; Makefile exports these.
set -euo pipefail
PROFILE=${PROFILE:-rubyzg-talk}
REGION=${REGION:-eu-central-1}
ARCH=${ARCH:-arm64}
FUNCTION=${FUNCTION:-rubyzg-spinel-demo}
MEMORY=${MEMORY:-1769}
ROLE=${ROLE:-$FUNCTION-role}
AWS_BIN=${AWS:-/opt/homebrew/bin/aws}
TAGS_KV="project=rubyzg-talk"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
aws_() { "$AWS_BIN" --profile "$PROFILE" --region "$REGION" "$@"; }
iam_() { "$AWS_BIN" --profile "$PROFILE" "$@"; }
