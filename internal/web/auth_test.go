package web

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func testDist() fstest.MapFS {
	return fstest.MapFS{
		"index.html":          {Data: []byte("<html></html>")},
		"assets/index-abc.js": {Data: []byte("console.log(1)")},
	}
}

func okHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

func TestRequireAuth(t *testing.T) {
	dist := testDist()
	handler := RequireAuth(dist, "test-only-password", okHandler())

	cases := []struct {
		name       string
		path       string
		user, pass string
		setAuth    bool
		wantStatus int
	}{
		{"remote route needs no password", "/remote", "", "", false, http.StatusOK},
		{"remote sub-path needs no password", "/remote/", "", "", false, http.StatusOK},
		{"static asset needs no password", "/assets/index-abc.js", "", "", false, http.StatusOK},
		{"home is gated without credentials", "/", "", "", false, http.StatusUnauthorized},
		{"talk route is gated without credentials", "/t/some-talk", "", "", false, http.StatusUnauthorized},
		{"home is gated with wrong password", "/", "", "wrong", true, http.StatusUnauthorized},
		{"home succeeds with correct password", "/", "", "test-only-password", true, http.StatusOK},
		{"talk route succeeds with correct password", "/t/some-talk", "", "test-only-password", true, http.StatusOK},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			if tc.setAuth {
				req.SetBasicAuth(tc.user, tc.pass)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tc.wantStatus {
				t.Fatalf("path %s: got status %d, want %d", tc.path, rec.Code, tc.wantStatus)
			}
			if tc.wantStatus == http.StatusUnauthorized {
				if got := rec.Header().Get("WWW-Authenticate"); got == "" {
					t.Fatalf("path %s: expected WWW-Authenticate header on 401", tc.path)
				}
			}
		})
	}
}
