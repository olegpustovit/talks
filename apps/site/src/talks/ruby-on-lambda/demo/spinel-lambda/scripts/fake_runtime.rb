# Local stand-in for the Lambda Runtime API (CRuby, test-only; not deployed).
#   ruby scripts/fake_runtime.rb [port] [events] [out_dir]
# Hands out `events` Function URL events, writes each response body to
# out_dir/response-N.json, then exits.
require "socket"
require "json"

port = (ARGV[0] || 9001).to_i
events = (ARGV[1] || 3).to_i
out = ARGV[2] || "."
server = TCPServer.new("127.0.0.1", port)
handed = 0
answered = 0

def read_req(c)
  line = c.gets or return nil
  method, path, = line.split(" ")
  headers = {}
  while (l = c.gets) && l != "\r\n"
    k, v = l.split(":", 2)
    headers[k.downcase] = v.strip
  end
  body = c.read(headers["content-length"].to_i)
  [method, path, body]
end

def reply(c, status, headers, body)
  h = headers.merge("Content-Length" => body.bytesize.to_s, "Connection" => "close")
  c.write("HTTP/1.1 #{status} OK\r\n" + h.map { |k, v| "#{k}: #{v}\r\n" }.join + "\r\n" + body)
  c.close
end

while answered < events
  c = server.accept
  method, path, body = read_req(c)
  if method == "GET" && path.end_with?("/invocation/next")
    handed += 1
    ev = { version: "2.0", rawPath: "/", rawQueryString: handed.even? ? "format=json" : "", headers: {}, requestContext: { http: { method: "GET", path: "/" } }, isBase64Encoded: false }
    reply(c, 200, { "Lambda-Runtime-Aws-Request-Id" => "local-#{handed}", "Lambda-Runtime-Deadline-Ms" => "0", "Content-Type" => "application/json" }, JSON.generate(ev))
  else
    answered += 1
    File.write(File.join(out, "response-#{answered}.json"), body)
    warn "#{method} #{path} (#{body.bytesize} bytes)"
    reply(c, 202, { "Content-Type" => "application/json" }, "{}")
  end
end
