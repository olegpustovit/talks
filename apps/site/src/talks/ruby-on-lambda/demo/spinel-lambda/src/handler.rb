# A whole AWS Lambda custom runtime, in Ruby, compiled ahead of time by Spinel.
#
# The Lambda Runtime API is plain HTTP on localhost: GET the next event,
# POST the response, repeat. This process is the `bootstrap` executable;
# nothing else runs in the sandbox: no interpreter, no shim.
require "socket"
require "json"
require_relative "build_info" # BUILD_* constants, generated at build time
require_relative "source"     # SOURCE = this file's text, embedded at build time

STARTED = Process.clock_gettime(Process::CLOCK_MONOTONIC)
PRIME_LIMIT = 200_000
HISTORY = 8

def binary_size
  begin
    "#{File.size("/proc/self/exe") / 1024} KB"
  rescue
    "?"
  end
end

BINARY_SIZE = binary_size

# ---- tiny HTTP/1.1 client for the Runtime API ------------------------------

def http(method, path, body)
  host, port = ENV["AWS_LAMBDA_RUNTIME_API"].split(":")
  sock = TCPSocket.new(host, port.to_i)
  sock.write("#{method} #{path} HTTP/1.1\r\nHost: #{host}\r\n" \
             "Content-Type: application/json\r\n" \
             "Content-Length: #{body.bytesize}\r\nConnection: close\r\n\r\n#{body}")
  status = sock.gets.split(" ")[1].to_i
  headers = {}
  while (line = sock.gets) && line != "\r\n"
    k, v = line.split(":", 2)
    headers[k.downcase] = v.strip
  end
  len = headers["content-length"]
  data = len ? sock.read(len.to_i) : sock.read
  sock.close
  [status, headers, data]
end

# ---- the actual work: something you can see the CPU do ---------------------

def primes_upto(n)
  sieve = Array.new(n + 1, true)
  sieve[0] = false
  sieve[1] = false
  i = 2
  while i * i <= n
    if sieve[i]
      j = i * i
      while j <= n
        sieve[j] = false
        j += i
      end
    end
    i += 1
  end
  count = 0
  last = 0
  k = 0
  while k <= n
    if sieve[k]
      count += 1
      last = k
    end
    k += 1
  end
  [count, last]
end

def now
  Process.clock_gettime(Process::CLOCK_MONOTONIC)
end

def env(k)
  ENV[k] || "-"
end

def h(s)
  s.gsub("&", "&amp;").gsub("<", "&lt;").gsub(">", "&gt;").gsub("\"", "&quot;")
end

def format_ms(ms)
  if ms < 1000
    "#{ms} ms"
  elsif ms < 60_000
    "#{(ms / 100) / 10.0} s"
  else
    "#{ms / 60_000} min #{(ms % 60_000) / 1000} s"
  end
end

# ---- what this copy remembers: its last requests -----------------------------
# Kept in plain integer arrays; this process lives as long as Lambda keeps the copy warm.

HIST_N = []
HIST_US = []
HIST_UP = []

def remember(n, us, up)
  HIST_N.push(n)
  HIST_US.push(us)
  HIST_UP.push(up)
  if HIST_N.size > HISTORY
    HIST_N.shift
    HIST_US.shift
    HIST_UP.shift
  end
end

def history_rows
  peak = 1
  HIST_US.each { |us| peak = us if us > peak }
  rows = ""
  i = HIST_N.size - 1
  while i >= 0
    w = (HIST_US[i] * 100) / peak
    cold = HIST_N[i] == 1 ? " cold" : ""
    rows += "<li class=\"#{cold}\"><span>##{HIST_N[i]}</span><i style=\"width:#{w}%\"></i><b>#{HIST_US[i]} µs</b><em>+#{format_ms(HIST_UP[i])}</em></li>"
    i -= 1
  end
  rows
end

# ---- the page -----------------------------------------------------------------

def fact(label, value, tone)
  "<div class=\"f\"><span>#{label}</span><b class=\"#{tone}\">#{h(value)}</b></div>"
end

def page(served, cold, uptime_ms, work_us, primes, req_id, copy)
  n, largest = primes
  start = cold ? "<b class=\"coral\">COLD START</b>" : "<b class=\"accent\">WARM</b>"
  <<~HTML
    <!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Ruby, compiled by Spinel, on Lambda</title>
    <style>
    :root{--bg:#080a0b;--s:#111514;--s2:#161b1a;--line:#232b29;--fg:#eeefeb;--m:#909795;--a:#b5e3bc;--c:#ff796b;--cy:#8bcbd7;--am:#e6cd8d;--l:#c1b4e8}
    *{box-sizing:border-box;border-radius:0}
    html,body{height:100%}
    body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 Geist,'Helvetica Neue',Arial,sans-serif;display:flex;flex-direction:column}
    header{display:flex;align-items:baseline;gap:14px;padding:12px 18px 9px;border-bottom:1px solid var(--line)}
    h1{font-size:17px;font-weight:500;margin:0;letter-spacing:-.01em}h1 em{font-style:normal;color:var(--a)}
    header .state{margin-left:auto;display:flex;gap:10px;align-items:baseline;font-size:12px;color:var(--m)}
    .state b{font-size:11px;letter-spacing:.08em;padding:2px 6px;border:1px solid currentColor}
    nav{display:flex;gap:0;padding:0 18px;border-bottom:1px solid var(--line)}
    nav button{font:inherit;font-size:12.5px;background:none;color:var(--m);border:0;border-bottom:2px solid transparent;padding:8px 12px 7px;cursor:pointer}
    nav button[aria-selected=true]{color:var(--fg);border-color:var(--a)}
    main{flex:1;min-height:0;overflow:auto;padding:10px 18px 12px}
    section[hidden]{display:none}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
    .f{background:var(--s);padding:7px 10px;min-width:0}
    .f span{display:block;color:var(--m);font-size:10.5px;text-transform:uppercase;letter-spacing:.06em}
    .f b{display:block;font-weight:500;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
    .accent{color:var(--a)}.coral{color:var(--c)}.cyan{color:var(--cy)}.amber{color:var(--am)}.lav{color:var(--l)}
    .mono{font-family:ui-monospace,Menlo,monospace;font-size:12.5px}
    .row{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;margin-top:10px}
    h2{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--m);margin:0 0 8px;display:flex;gap:10px;align-items:baseline}
    h2 span{text-transform:none;letter-spacing:0;color:var(--fg);font-variant-numeric:tabular-nums}
    #chart{position:relative;height:104px;border-bottom:1px solid var(--line);display:flex;align-items:flex-end;gap:3px}
    #chart div{flex:1;min-width:3px;position:relative;background:var(--cy);opacity:.85}
    #chart div i{position:absolute;left:0;right:0;bottom:0;background:var(--a)}
    #chart div.cold{background:var(--c)}
    #chart div.new{animation:pop .35s ease-out}
    @keyframes pop{from{transform:scaleY(.2);transform-origin:bottom;opacity:.2}}
    .legend{display:flex;gap:14px;margin-top:6px;font-size:11px;color:var(--m)}
    .legend i{display:inline-block;width:8px;height:8px;margin-right:5px;vertical-align:baseline}
    ul{list-style:none;margin:0;padding:0;font-size:12px;font-variant-numeric:tabular-nums}
    li{display:grid;grid-template-columns:36px 1fr 64px 62px;gap:8px;align-items:center;padding:2px 0;border-bottom:1px solid var(--s2)}
    li span{color:var(--m)}li i{display:block;height:6px;background:var(--a)}li.cold i{background:var(--c)}li b{font-weight:500;text-align:right}li em{font-style:normal;color:var(--m);text-align:right}
    .bar{display:flex;gap:10px;margin-top:10px;align-items:center;font-size:12px;color:var(--m)}
    button.act{font:inherit;font-size:12px;background:var(--a);color:var(--bg);border:0;padding:6px 12px;cursor:pointer;font-weight:500}
    button.act:disabled{opacity:.5;cursor:default}
    pre{margin:0;background:var(--s);border:1px solid var(--line);padding:10px 0;font:12px/1.55 ui-monospace,Menlo,monospace;color:var(--fg);counter-reset:ln;overflow:auto}
    pre span.l{display:block;padding:0 14px 0 0;white-space:pre}
    pre span.l::before{counter-increment:ln;content:counter(ln);display:inline-block;width:34px;margin-right:14px;text-align:right;color:#4a5452}
    pre span.l.hot{background:rgba(181,227,188,.08);box-shadow:inset 2px 0 var(--a)}
    .k{color:var(--a)}.s{color:var(--am)}.c{color:var(--m);font-style:italic}.n{color:var(--c)}.y{color:var(--l)}.t{color:var(--cy)}
    @media (max-width:640px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.row{grid-template-columns:1fr}}
    </style></head><body>
    <header><h1>Native code, compiled from <em>Ruby</em> by Spinel</h1>
    <div class="state">#{start}<span>request ##{served} on copy #{h(copy)} · up #{format_ms(uptime_ms)}</span></div></header>
    <nav role="tablist"><button role="tab" aria-selected="true" data-tab="live">Live</button><button role="tab" aria-selected="false" data-tab="src">Source · handler.rb</button><button role="tab" aria-selected="false" data-tab="build">Build</button></nav>
    <main>
    <section id="live">
    <div class="grid">
    #{fact("Ruby work", "#{work_us} µs", "accent")}
    #{fact("primes ≤ #{PRIME_LIMIT}", "#{n} (last #{largest})", "cyan")}
    #{fact("process uptime", format_ms(uptime_ms), "lav")}
    #{fact("binary", "#{BINARY_SIZE} · #{BUILD_ARCH}", "amber")}
    </div>
    <div class="row">
    <div><h2>Round trips from this page <span id="stats">waiting</span></h2>
    <div id="chart"></div>
    <div class="legend"><span><i style="background:var(--cy)"></i>network + Lambda</span><span><i style="background:var(--a)"></i>Ruby work</span><span><i style="background:var(--c)"></i>cold start</span></div></div>
    <div><h2>This copy remembers <span>last #{HIST_N.size}</span></h2><ul>#{history_rows}</ul></div>
    </div>
    <div class="bar"><button class="act" id="fire" type="button">Fire 20 requests</button><span id="note">each one is a full Lambda invocation, measured in your browser</span></div>
    </section>
    <section id="src" hidden><pre id="code">#{h(SOURCE)}</pre></section>
    <section id="build" hidden>
    <div class="grid">
    #{fact("compiler", "Spinel #{BUILD_SPINEL}", "accent")}
    #{fact("C compiler", BUILD_CC, "")}
    #{fact("target", BUILD_TARGET, "cyan")}
    #{fact("runtime", "provided.al2023", "")}
    #{fact("function", env("AWS_LAMBDA_FUNCTION_NAME"), "")}
    #{fact("region", env("AWS_REGION"), "")}
    #{fact("memory", "#{env("AWS_LAMBDA_FUNCTION_MEMORY_SIZE")} MB", "lav")}
    #{fact("request id", req_id, "mono")}
    </div>
    <p style="color:var(--m);font-size:12.5px;margin:12px 0 0">handler.rb → spinel → one C file → zig cc → a static ELF called <span class="mono">bootstrap</span>. No interpreter, no shim: this binary runs the Runtime API loop itself.</p>
    </section>
    </main>
    <script>
    (function(){
    var tabs=document.querySelectorAll('nav button');
    tabs.forEach(function(b){b.onclick=function(){tabs.forEach(function(x){x.setAttribute('aria-selected',x===b);document.getElementById(x.dataset.tab).hidden=x!==b;});};});
    var KW=['def','end','do','if','elsif','else','while','begin','rescue','return','require','require_relative','loop','unless','nil','true','false','self'];
    var pre=document.getElementById('code');var src=pre.textContent.split(String.fromCharCode(10));
    var esc=function(s){return s.split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');};
    var hot=['def http(','def primes_upto(','loop do','http("POST"'];
    pre.innerHTML=src.map(function(line){
      var out='',i=0,c=line.indexOf('#');
      var code=line,com='';
      var q=false;for(var j=0;j<line.length;j++){var ch=line[j];if(ch==='"')q=!q;if(ch==='#'&&!q&&line[j+1]!=='{'){code=line.slice(0,j);com=line.slice(j);break;}}
      var toks=code.split(/("[^"]*"|[A-Za-z_][A-Za-z0-9_]*[?!]?|[0-9][0-9_]*|:[a-z_]+)/);
      toks.forEach(function(t){if(!t)return;var e=esc(t);
        if(t[0]==='"')out+='<span class="s">'+e+'</span>';
        else if(/^[0-9]/.test(t))out+='<span class="n">'+e+'</span>';
        else if(t[0]===':'&&t.length>1)out+='<span class="y">'+e+'</span>';
        else if(KW.indexOf(t)>=0)out+='<span class="k">'+e+'</span>';
        else if(/^[A-Z]/.test(t))out+='<span class="t">'+e+'</span>';
        else out+=e;});
      if(com)out+='<span class="c">'+esc(com)+'</span>';
      var isHot=hot.some(function(h){return line.indexOf(h)>=0;});
      return '<span class="l'+(isHot?' hot':'')+'">'+(out||' ')+'</span>';
    }).join('');
    var chart=document.getElementById('chart'),stats=document.getElementById('stats'),fire=document.getElementById('fire'),note=document.getElementById('note');
    var rtts=[],copies={},colds=0,peak=1;
    function draw(){peak=Math.max.apply(null,rtts.map(function(r){return r.ms;}).concat([1]));
      chart.innerHTML='';rtts.forEach(function(r,i){var d=document.createElement('div');d.style.height=Math.max(3,r.ms/peak*100)+'%';
        if(r.cold)d.className='cold';if(i===rtts.length-1)d.className+=' new';
        var w=document.createElement('i');w.style.height=Math.max(1,(r.us/1000)/r.ms*100)+'%';d.appendChild(w);d.title=Math.round(r.ms)+' ms, Ruby '+r.us+' µs';chart.appendChild(d);});
      var s=rtts.map(function(r){return r.ms;}).sort(function(a,b){return a-b;});
      if(s.length){var p50=s[Math.floor(s.length*.5)],p95=s[Math.min(s.length-1,Math.floor(s.length*.95))];
        stats.textContent='p50 '+Math.round(p50)+' ms · p95 '+Math.round(p95)+' ms · '+Object.keys(copies).length+' cop'+(Object.keys(copies).length===1?'y':'ies')+(colds?' · '+colds+' cold':'');}}
    function one(k){var t0=performance.now();
      return fetch(location.pathname+'?format=json&k='+k+'&t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
        var ms=performance.now()-t0;copies[j.copy]=1;if(j.cold)colds++;rtts.push({ms:ms,us:j.work_us,cold:j.cold});if(rtts.length>40)rtts.shift();draw();});}
    function burst(n){fire.disabled=true;note.textContent='firing…';var k=0;
      (function next(){if(k>=n){fire.disabled=false;note.textContent='each one is a full Lambda invocation, measured in your browser';return;}one(k++).then(next,function(){note.textContent='request failed';fire.disabled=false;});})();}
    fire.onclick=function(){burst(20);};
    // The deck's phone trackpad can't reach into this iframe, so it posts the click point here.
    window.addEventListener('message',function(e){var d=e.data;if(!d)return;var el=document.elementFromPoint(d.x,d.y);if(d.type==='se-click'){if(el&&el.click)el.click();}if(d.type==='se-scroll'){while(el&&el!==document.body){var st=getComputedStyle(el);if(/(auto|scroll)/.test(st.overflowY)&&el.scrollHeight>el.clientHeight){el.scrollBy(d.dx,d.dy);return;}el=el.parentElement;}document.querySelector('main').scrollBy(d.dx,d.dy);}});
    setTimeout(function(){burst(12);},400);
    })();
    </script>
    </body></html>
  HTML
end

# ---- the runtime loop ---------------------------------------------------------

served = 0
copy = "?"
loop do
  _, headers, event = http("GET", "/2018-06-01/runtime/invocation/next", "")
  req_id = headers["lambda-runtime-aws-request-id"]
  served += 1
  copy = req_id[0, 4] if served == 1
  begin
    ev = JSON.parse(event)
    qs = ev["rawQueryString"]
    want_json = qs ? qs.to_s.include?("format=json") : false
    t0 = now
    primes = primes_upto(PRIME_LIMIT)
    work_us = ((now - t0) * 1_000_000).round
    uptime_ms = ((now - STARTED) * 1000).round
    remember(served, work_us, uptime_ms)
    if want_json
      body = JSON.generate({ "n" => served, "cold" => served == 1, "work_us" => work_us,
                             "uptime_ms" => uptime_ms, "copy" => copy, "id" => req_id })
      type = "application/json"
    else
      body = page(served, served == 1, uptime_ms, work_us, primes, req_id, copy)
      type = "text/html; charset=utf-8"
    end
    reply = {
      "statusCode" => 200,
      "headers" => { "content-type" => type, "cache-control" => "no-store", "access-control-allow-origin" => "*" },
      "body" => body
    }
    http("POST", "/2018-06-01/runtime/invocation/#{req_id}/response", JSON.generate(reply))
  rescue => e
    err = { "errorMessage" => e.message, "errorType" => e.class.name }
    http("POST", "/2018-06-01/runtime/invocation/#{req_id}/error", JSON.generate(err))
  end
end
