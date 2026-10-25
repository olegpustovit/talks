# Build the React site, embed it, and produce bin/slides.
.PHONY: frontend embed build build-linux deploy

frontend:
	bun run build

embed: frontend
	rm -rf internal/web/dist
	mkdir -p internal/web/dist
	cp -R apps/site/dist/. internal/web/dist/

build: embed
	mkdir -p bin
	CGO_ENABLED=0 go build -o bin/slides ./cmd/slides

# oracle-vm is aarch64 Linux.
build-linux: embed
	mkdir -p bin
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o bin/slides-linux-arm64 ./cmd/slides

# Every deploy removes and recreates the smdctl service rather than reusing
# a running one: `smdctl start` on an existing service does NOT re-read
# smdctl.yml, so a changed environment/restart-policy/etc. would silently
# keep running under the old config. These run as plain `ssh host '...'`
# (fish, oracle-vm's login shell, executes the string) rather than
# `ssh host bash -c '...'`: a non-login bash -c has no PATH set up (fish's
# login config, not bash's, puts /usr/local/bin on it there), so smdctl
# can't be found. The command chains below use only `;`/`&&`, since fish
# parses a bare `(...)` as its own command substitution and rejects it.
# The service is stopped BEFORE scp: overwriting a running binary in place
# fails with ETXTBSY (text file busy), since scp writes into the existing
# file rather than replacing it atomically.
deploy: build-linux
	test -f smdctl.local.yml # Copy smdctl.yml and set the private runtime password first.
	ssh oracle-vm 'smdctl stop slides; mkdir -p ~/projects/talks/bin'
	scp bin/slides-linux-arm64 oracle-vm:~/projects/talks/bin/slides
	scp smdctl.local.yml oracle-vm:~/projects/talks/smdctl.yml
	ssh oracle-vm 'chmod +x ~/projects/talks/bin/slides && smdctl rm -f slides; cd ~/projects/talks && smdctl run -f smdctl.yml'
	ssh oracle-vm 'smdctl status slides'
