#!/usr/bin/env sh
set -eu

build_mode="${1:-release}"

if ! command -v em++ >/dev/null 2>&1; then
  echo "em++ was not found. Activate the Emscripten SDK first." >&2
  exit 1
fi

common_flags="--no-entry -sMODULARIZE -sEXPORT_ES6 -sENVIRONMENT=web -sEXPORTED_FUNCTIONS=_malloc,_free,_posterize -sFILESYSTEM=0"

case "$build_mode" in
  release)
    # shellcheck disable=SC2086
    em++ pixel_lab.cpp -std=c++17 -O3 $common_flags -o pixel_lab.mjs
    ;;
  debug)
    # shellcheck disable=SC2086
    em++ pixel_lab.cpp -std=c++17 -O0 -gsource-map -sASSERTIONS=2 -sSAFE_HEAP=1 $common_flags -o pixel_lab.mjs
    ;;
  *)
    echo "Usage: ./build.sh [release|debug]" >&2
    exit 2
    ;;
esac

echo "Built pixel_lab.mjs and pixel_lab.wasm in $(pwd)"

