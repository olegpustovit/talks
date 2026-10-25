package hub

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/coder/websocket"
)

type Role string

const (
	RoleDeck   Role = "deck"
	RoleRemote Role = "remote"
)

// A deck state carries a slide's speaker notes, which outgrow the library's
// 32 KiB default read limit on long slides.
const readLimit = 1 << 20

type Message struct {
	Type     string          `json:"type"`
	Role     string          `json:"role,omitempty"`
	Decks    int             `json:"decks,omitempty"`
	Remotes  int             `json:"remotes,omitempty"`
	Password string          `json:"password,omitempty"`
	Notes    bool            `json:"notes,omitempty"`
	State    json.RawMessage `json:"state,omitempty"`
}

type client struct {
	conn  *websocket.Conn
	role  Role
	notes bool
}

// Hub fans remote control messages out to every connected deck, and the
// deck's current slide and speaker notes out to remotes allowed to see them.
type Hub struct {
	log      *slog.Logger
	password string
	mu       sync.Mutex
	clients  map[*client]struct{}
	state    json.RawMessage
}

// New returns a Hub. Every remote receives deck state (titles, step captions, timing) and may
// drive the deck; /remote and /ws are exempt from the site's password gate. The password is kept
// for callers that still pass it, but no longer gates anything here.
func New(log *slog.Logger, password string) *Hub {
	if log == nil {
		log = slog.Default()
	}
	return &Hub{
		log:      log,
		password: password,
		clients:  make(map[*client]struct{}),
	}
}

func (h *Hub) ServeWS(ctx context.Context, conn *websocket.Conn) {
	conn.SetReadLimit(readLimit)
	c := &client{conn: conn, role: RoleDeck}
	h.add(c)
	defer h.remove(c)

	_ = h.write(ctx, c, Message{Type: "hello", Role: string(c.role)})
	h.broadcastStatus()

	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			return
		}

		var msg Message
		if err := json.Unmarshal(data, &msg); err != nil {
			h.log.Debug("ws bad json", "err", err)
			continue
		}

		switch msg.Type {
		case "hello":
			role := Role(msg.Role)
			if role != RoleDeck && role != RoleRemote {
				role = RoleDeck
			}
			// Deck state is slide titles, step captions and timing: no speaker notes. Every remote
			// gets it, so the phone shows the slide list and preview without its own password.
			notes := role == RoleRemote
			h.setRole(c, role, notes)
			_ = h.write(ctx, c, Message{Type: "hello", Role: string(role), Notes: notes})
			if state := h.lastState(); notes && state != nil {
				_ = h.write(ctx, c, Message{Type: "state", State: state})
			}
			h.broadcastStatus()
		case "next", "prev":
			if c.role != RoleRemote {
				continue
			}
			h.broadcast(Message{Type: msg.Type}, func(c *client) bool { return c.role == RoleDeck })
		case "nextSlide", "prevSlide", "goto", "pointer", "scroll":
			// Slide jumps and the trackpad pointer carry their own fields (index, x, y, click);
			// pass the remote's message through to decks as sent.
			if c.role != RoleRemote {
				continue
			}
			h.broadcastRaw(data, func(c *client) bool { return c.role == RoleDeck })
		case "state":
			if c.role != RoleDeck || len(msg.State) == 0 {
				continue
			}
			h.setState(msg.State)
			h.broadcast(Message{Type: "state", State: msg.State}, func(c *client) bool { return c.notes })
		case "ping":
			_ = h.write(ctx, c, Message{Type: "pong"})
		default:
			h.log.Debug("ws unknown type", "type", msg.Type)
		}
	}
}

func (h *Hub) add(c *client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

func (h *Hub) remove(c *client) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
	h.broadcastStatus()
}

func (h *Hub) setRole(c *client, role Role, notes bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	c.role = role
	c.notes = notes
}

func (h *Hub) setState(state json.RawMessage) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.state = append(json.RawMessage(nil), state...)
}

func (h *Hub) lastState() json.RawMessage {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.state
}

func (h *Hub) counts() (decks, remotes int) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		switch c.role {
		case RoleRemote:
			remotes++
		default:
			decks++
		}
	}
	return decks, remotes
}

func (h *Hub) broadcastStatus() {
	decks, remotes := h.counts()
	h.broadcast(Message{Type: "status", Decks: decks, Remotes: remotes}, func(*client) bool { return true })
}

func (h *Hub) broadcast(msg Message, to func(*client) bool) {
	h.mu.Lock()
	targets := make([]*client, 0, len(h.clients))
	for c := range h.clients {
		if to(c) {
			targets = append(targets, c)
		}
	}
	h.mu.Unlock()

	ctx := context.Background()
	for _, c := range targets {
		if err := h.write(ctx, c, msg); err != nil {
			h.log.Debug("ws write failed", "err", err)
		}
	}
}

func (h *Hub) broadcastRaw(data []byte, to func(*client) bool) {
	h.mu.Lock()
	targets := make([]*client, 0, len(h.clients))
	for c := range h.clients {
		if to(c) {
			targets = append(targets, c)
		}
	}
	h.mu.Unlock()

	ctx := context.Background()
	for _, c := range targets {
		if err := c.conn.Write(ctx, websocket.MessageText, data); err != nil {
			h.log.Debug("ws write failed", "err", err)
		}
	}
}

func (h *Hub) write(ctx context.Context, c *client, msg Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return c.conn.Write(ctx, websocket.MessageText, data)
}
