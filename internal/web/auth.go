package web

import (
	"crypto/subtle"
	"io/fs"
	"net/http"
	"strings"
)

// RequireAuth password-gates every request except the phone remote page and
// any real static asset — the remote needs the same JS/CSS bundle as the
// gated pages just to load, so assets stay public. It never touches /ws or
// /healthz; those are wired on separate mux entries in main.go and both the
// desktop deck and the phone remote share /ws, so it can't require a
// password without breaking the remote.
func RequireAuth(dist fs.FS, password string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if exempt(dist, r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}
		_, pass, ok := r.BasicAuth()
		if !ok || subtle.ConstantTimeCompare([]byte(pass), []byte(password)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="slides", charset="UTF-8"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func exempt(dist fs.FS, urlPath string) bool {
	if urlPath == "/remote" || strings.HasPrefix(urlPath, "/remote/") {
		return true
	}
	path := strings.TrimPrefix(urlPath, "/")
	if path == "" {
		return false // "/" is the talk index — gated
	}
	if f, err := dist.Open(path); err == nil {
		_ = f.Close()
		return true // a real static asset (JS/CSS/image), not an SPA route
	}
	return false
}
