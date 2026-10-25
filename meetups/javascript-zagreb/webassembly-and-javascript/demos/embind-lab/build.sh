#!/usr/bin/env sh
set -eu

build_mode="${1:-release}"

if ! command -v em++ >/dev/null 2>&1; then
  echo "em++ was not found. Activate the Emscripten SDK first." >&2
  exit 1
fi

common_flags="--bind --no-entry -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=web -sFILESYSTEM=0"

case "$build_mode" in
  release)
    # shellcheck disable=SC2086
    em++ palette.cpp -std=c++17 -O3 $common_flags -o palette.mjs
    ;;
  debug)
    # shellcheck disable=SC2086
    em++ palette.cpp -std=c++17 -O0 -gsource-map -sASSERTIONS=2 $common_flags -o palette.mjs
    ;;
  *)
    echo "Usage: ./build.sh [release|debug]" >&2
    exit 2
    ;;
esac

echo "Built palette.mjs and palette.wasm in $(pwd)"

