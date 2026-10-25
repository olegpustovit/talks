#include <cstddef>
#include <cstdint>
#include <string>

#include <emscripten/bind.h>

class Palette {
 public:
  void add(uint8_t red, uint8_t green, uint8_t blue) {
    red_total_ += red;
    green_total_ += green;
    blue_total_ += blue;
    size_ += 1;
  }

  std::size_t size() const { return size_; }

  std::string dominant_channel() const {
    if (size_ == 0) return "none";
    if (red_total_ >= green_total_ && red_total_ >= blue_total_) return "red";
    if (green_total_ >= blue_total_) return "green";
    return "blue";
  }

 private:
  uint64_t red_total_ = 0;
  uint64_t green_total_ = 0;
  uint64_t blue_total_ = 0;
  std::size_t size_ = 0;
};

EMSCRIPTEN_BINDINGS(palette_api) {
  emscripten::class_<Palette>("Palette")
      .constructor<>()
      .function("add", &Palette::add)
      .function("size", &Palette::size)
      .function("dominantChannel", &Palette::dominant_channel);
}

