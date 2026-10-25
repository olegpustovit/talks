#include <algorithm>
#include <cstddef>
#include <cstdint>

#include <emscripten/emscripten.h>

namespace {

uint8_t quantize(uint8_t value, uint8_t levels) {
  const uint16_t steps = static_cast<uint16_t>(levels - 1);
  const uint16_t bucket =
      (static_cast<uint16_t>(value) * steps + 127) / 255;
  return static_cast<uint8_t>((bucket * 255) / steps);
}

}  // namespace

extern "C" {

EMSCRIPTEN_KEEPALIVE
void posterize(uint8_t* pixels, std::size_t length, uint8_t requested_levels) {
  const uint8_t levels = std::clamp<uint8_t>(requested_levels, 2, 16);

  for (std::size_t i = 0; i + 3 < length; i += 4) {
    pixels[i] = quantize(pixels[i], levels);
    pixels[i + 1] = quantize(pixels[i + 1], levels);
    pixels[i + 2] = quantize(pixels[i + 2], levels);
  }
}

}  // extern "C"

