package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/coder/websocket"
	"github.com/snowbear/talks/internal/hub"
	"github.com/snowbear/talks/internal/web"
)

func main() {
	if err := run(); err != nil {
		slog.Error("slides server failed", "err", err)
		os.Exit(1)
	}
}

func run() error {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	host := envOr("HOST", "0.0.0.0")
	port := envOr("PORT", "1578")
	addr := net.JoinHostPort(host, port)

	dist, err := web.DistFS()
	if err != nil {
		return fmt.Errorf("open embedded dist: %w", err)
	}

	password := os.Getenv("SLIDES_PASSWORD")
	control := hub.New(log, password)
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ok\n"))
	})
	mux.HandleFunc("GET /ws", func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
			InsecureSkipVerify: true, // same-origin via Vite proxy or Caddy
		})
		if err != nil {
			log.Warn("websocket accept failed", "err", err)
			return
		}
		defer conn.CloseNow()
		control.ServeWS(r.Context(), conn)
	})
	var spaHandler http.Handler = web.SPA(dist)
	if password != "" {
		spaHandler = web.RequireAuth(dist, password, spaHandler)
		log.Info("password gate enabled", "exempt", "/remote")
	}
	mux.Handle("/", spaHandler)

	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		log.Info("slides listening", "addr", addr)
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("shutdown: %w", err)
		}
		return nil
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
