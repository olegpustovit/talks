# Embind lab

This small demo exposes a C++ `Palette` class as a JavaScript constructor. The
API feels ordinary until the JavaScript code has to call `palette.delete()`.

## Build

```sh
./build.sh release
```

Or build with assertions:

```sh
./build.sh debug
```

The page starts with an explicitly labelled JavaScript fallback. After a build,
reload it and confirm that the badge says `C++ / Embind`.

During the talk, add a few colors, point out the ordinary-looking methods, and press
"Destroy and recreate." The event log shows the deterministic call to
`delete()` before JavaScript drops the wrapper.
