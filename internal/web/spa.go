package web

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed all:dist
var distEmbed embed.FS

func DistFS() (fs.FS, error) {
	return fs.Sub(distEmbed, "dist")
}

// SPA serves the Vite build: real files when present, otherwise index.html
// so React Router can handle /t/... and /remote.
func SPA(root fs.FS) http.Handler {
	fileServer := http.FileServerFS(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if f, err := root.Open(path); err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// SPA fallback for client routes.
		r = r.Clone(r.Context())
		r.URL.Path = "/"
		http.ServeFileFS(w, r, root, "index.html")
	})
}
