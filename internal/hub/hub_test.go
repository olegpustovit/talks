package hub_test

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coder/websocket"
	"github.com/snowbear/talks/internal/hub"
)

func TestRemoteAdvancesDeck(t *testing.T) {
	url := serve(t, hub.New(quiet(), ""))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	deck := dial(t, ctx, url, `{"type":"hello","role":"deck"}`)
	remote := dial(t, ctx, url, `{"type":"hello","role":"remote"}`)

	if err := remote.Write(ctx, websocket.MessageText, []byte(`{"type":"next"}`)); err != nil {
		t.Fatalf("send next: %v", err)
	}
	drainUntil(t, ctx, deck, "next")
}

func TestDeckStateReachesOnlyRemotesWithThePassword(t *testing.T) {
	url := serve(t, hub.New(quiet(), "secret"))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	deck := dial(t, ctx, url, `{"type":"hello","role":"deck"}`)
	sendState(t, ctx, deck, 3)

	stranger := dial(t, ctx, url, `{"type":"hello","role":"remote","password":"nope"}`)

	// A remote that connects after the deck moved still gets the current slide.
	phone, hello := dialHello(t, ctx, url, `{"type":"hello","role":"remote","password":"secret"}`)
	if !hello.Notes {
		t.Fatal("remote with the password was not allowed notes")
	}
	if got := stateIndex(t, drainUntil(t, ctx, phone, "state")); got != 3 {
		t.Fatalf("cached state index = %d, want 3", got)
	}

	sendState(t, ctx, deck, 4)
	if got := stateIndex(t, drainUntil(t, ctx, phone, "state")); got != 4 {
		t.Fatalf("live state index = %d, want 4", got)
	}

	quietCtx, quietCancel := context.WithTimeout(ctx, 300*time.Millisecond)
	defer quietCancel()
	for {
		_, data, err := stranger.Read(quietCtx)
		if err != nil {
			return // timed out without ever seeing state
		}
		var msg hub.Message
		if json.Unmarshal(data, &msg) == nil && msg.Type == "state" {
			t.Fatal("remote with the wrong password received deck state")
		}
	}
}

func quiet() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func serve(t *testing.T, h *hub.Hub) string {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
		if err != nil {
			t.Errorf("accept: %v", err)
			return
		}
		defer conn.CloseNow()
		h.ServeWS(r.Context(), conn)
	}))
	t.Cleanup(srv.Close)
	return "ws" + srv.URL[len("http"):]
}

func dial(t *testing.T, ctx context.Context, url, hello string) *websocket.Conn {
	t.Helper()
	conn, _ := dialHello(t, ctx, url, hello)
	return conn
}

// dialHello connects, sends hello, and returns the hub's hello reply to it.
func dialHello(t *testing.T, ctx context.Context, url, hello string) (*websocket.Conn, hub.Message) {
	t.Helper()
	conn, _, err := websocket.Dial(ctx, url, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close(websocket.StatusNormalClosure, "") })
	if err := conn.Write(ctx, websocket.MessageText, []byte(hello)); err != nil {
		t.Fatalf("hello: %v", err)
	}
	// The hub greets every connection as a deck first; wait for the reply to our hello.
	var want hub.Message
	_ = json.Unmarshal([]byte(hello), &want)
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		msg := readMessage(t, ctx, conn)
		if msg.Type == "hello" && msg.Role == want.Role {
			return conn, msg
		}
	}
	t.Fatal("timed out waiting for hello")
	return nil, hub.Message{}
}

func sendState(t *testing.T, ctx context.Context, deck *websocket.Conn, index int) {
	t.Helper()
	data, _ := json.Marshal(map[string]any{"type": "state", "state": map[string]any{"index": index}})
	if err := deck.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatalf("send state: %v", err)
	}
}

func stateIndex(t *testing.T, msg hub.Message) int {
	t.Helper()
	var state struct {
		Index int `json:"index"`
	}
	if err := json.Unmarshal(msg.State, &state); err != nil {
		t.Fatalf("state json: %v", err)
	}
	return state.Index
}

func drainUntil(t *testing.T, ctx context.Context, conn *websocket.Conn, wantType string) hub.Message {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		msg := readMessage(t, ctx, conn)
		if msg.Type == wantType {
			return msg
		}
	}
	t.Fatalf("timed out waiting for %s", wantType)
	return hub.Message{}
}

func readMessage(t *testing.T, ctx context.Context, conn *websocket.Conn) hub.Message {
	t.Helper()
	_, data, err := conn.Read(ctx)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	var msg hub.Message
	if err := json.Unmarshal(data, &msg); err != nil {
		t.Fatalf("json: %v", err)
	}
	return msg
}
