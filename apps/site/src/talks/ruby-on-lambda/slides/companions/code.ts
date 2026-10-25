// Code shown on the back-to-basics slides. One request runs through all of them: GET /orders/8812.

/** A Lambda function URL event (payload format 2.0), trimmed to what the mapper reads. */
export const EVENT = [
  "{",
  '  "version": "2.0",',
  '  "rawPath": "/orders/8812",',
  '  "rawQueryString": "expand=items",',
  '  "headers": {',
  '    "accept": "application/json",',
  '    "host": "q3x7.lambda-url.eu-central-1.on.aws"',
  "  },",
  '  "queryStringParameters": { "expand": "items" },',
  '  "requestContext": {',
  '    "http": {',
  '      "method": "GET",',
  '      "sourceIp": "203.0.113.7"',
  "    }",
  "  },",
  '  "body": null,',
  '  "isBase64Encoded": false',
  "}",
];

export const BARE_HANDLER = [
  "# handler.rb: Lambda calls this method",
  'require "json"',
  "",
  "def handler(event:, context:)",
  '  id = event["rawPath"].split("/").last',
  "  {",
  "    statusCode: 200,",
  "    headers: {",
  '      "content-type" => "application/json"',
  "    },",
  "    body: JSON.generate(id: id)",
  "  }",
  "end",
];

export const BARE_RESPONSE = [
  "{",
  '  "statusCode": 200,',
  '  "headers": {',
  '    "content-type": "application/json"',
  "  },",
  '  "body": "{\\"id\\":\\"8812\\"}"',
  "}",
];

/** The env Puma builds for the same request, locally. */
export const PUMA_ENV = [
  "env = {",
  '  "REQUEST_METHOD"  => "GET",',
  '  "SCRIPT_NAME"     => "",',
  '  "PATH_INFO"       => "/orders/8812",',
  '  "QUERY_STRING"    => "expand=items",',
  '  "SERVER_NAME"     => "localhost",',
  '  "SERVER_PORT"     => "9292",',
  '  "SERVER_PROTOCOL" => "HTTP/1.1",',
  '  "HTTP_ACCEPT"     => "application/json",',
  '  "rack.url_scheme" => "http",',
  '  "rack.input"      => StringIO.new(""),',
  "}",
];

export const RACK_APP = [
  "# config.ru",
  "class App",
  "  def call(env)",
  '    id = env["PATH_INFO"].split("/").last',
  '    [200, { "content-type" => "text/plain" }, ["order #{id}"]]',
  "  end",
  "end",
  "",
  "run App.new",
];

/** The env the mapper builds from the Lambda event. Same keys, Lambda's values. */
export const LAMBDA_ENV = [
  "env = {",
  '  "REQUEST_METHOD"  => "GET",',
  '  "SCRIPT_NAME"     => "",',
  '  "PATH_INFO"       => "/orders/8812",',
  '  "QUERY_STRING"    => "expand=items",',
  '  "SERVER_NAME"     => "q3x7.lambda-url…",',
  '  "SERVER_PORT"     => "443",',
  '  "SERVER_PROTOCOL" => "HTTP/1.1",',
  '  "HTTP_ACCEPT"     => "application/json",',
  '  "rack.url_scheme" => "https",',
  '  "rack.input"      => StringIO.new(""),',
  "}",
];

export const MAPPER_ENV = [
  'require "base64"',
  'require "stringio"',
  "",
  "module LambdaRack",
  "  CGI_HEADERS = %w[CONTENT_TYPE CONTENT_LENGTH].freeze",
  "",
  "  def self.env(event)",
  '    http    = event.dig("requestContext", "http")',
  '    headers = event.fetch("headers", {})',
  '    body    = event["body"].to_s',
  '    body    = Base64.decode64(body) if event["isBase64Encoded"]',
  "",
  "    env = {",
  '      "REQUEST_METHOD"  => http["method"],',
  '      "SCRIPT_NAME"     => "",',
  '      "PATH_INFO"       => event["rawPath"],',
  '      "QUERY_STRING"    => event["rawQueryString"].to_s,',
  '      "SERVER_NAME"     => headers.fetch("host", "lambda"),',
  '      "SERVER_PORT"     => "443",',
  '      "SERVER_PROTOCOL" => "HTTP/1.1",',
  '      "rack.url_scheme" => "https",',
  '      "rack.input"      => StringIO.new(body),',
  '      "rack.errors"     => $stderr,',
  "    }",
  "    headers.each do |name, value|",
  '      key = name.upcase.tr("-", "_")',
  '      key = "HTTP_#{key}" unless CGI_HEADERS.include?(key)',
  "      env[key] = value",
  "    end",
  "    env",
  "  end",
];

export const MAPPER_RESPONSE = [
  "  def self.response(status, headers, body)",
  "    chunks = []",
  "    body.each { |chunk| chunks << chunk }",
  "    body.close if body.respond_to?(:close)",
  "    {",
  "      statusCode: status,",
  "      headers: headers.to_h,",
  "      body: chunks.join",
  "    }",
  "  end",
  "end",
];

export const HANDLER = [
  '# handler.rb, configured as "handler.handler"',
  'require_relative "lambda_rack"',
  'require_relative "app"',
  "",
  "APP = App.new # built once, when the copy starts",
  "",
  "def handler(event:, context:)",
  "  env = LambdaRack.env(event)",
  "  status, headers, body = APP.call(env)",
  "  LambdaRack.response(status, headers, body)",
  "end",
];

export const SINATRA_APP = [
  "# app.rb",
  'require "sinatra/base"',
  'require "sequel"',
  'require "json"',
  "",
  'DB = Sequel.connect(ENV.fetch("DATABASE_URL"))',
  "",
  "class App < Sinatra::Base",
  '  get "/orders/:id" do',
  "    content_type :json",
  "    DB[:orders][id: params[:id].to_i].to_json",
  "  end",
  "end",
];

export const CONFIG_RU = ["# config.ru, for Puma on your laptop", 'require_relative "app"', "run App"];

/** A custom runtime, minus error handling: the loop the managed runtime runs for you. */
export const RUNTIME = [
  "# runtime.rb: the whole runtime, minus error handling",
  'require "net/http"',
  'require "json"',
  'require_relative "handler"     # init: once per copy',
  "",
  'api  = ENV.fetch("AWS_LAMBDA_RUNTIME_API")',
  'base = "http://#{api}/2018-06-01/runtime/invocation"',
  "",
  "loop do",
  '  res = Net::HTTP.get_response(URI("#{base}/next"))',
  '  id  = res["Lambda-Runtime-Aws-Request-Id"]',
  "  out = handler(event: JSON.parse(res.body), context: {})",
  '  Net::HTTP.post(URI("#{base}/#{id}/response"), JSON.generate(out))',
  "end",
];

export const BOOTSTRAP = [
  "#!/bin/sh",
  "# provided.al2023 has no Ruby: it comes from a layer in /opt",
  "exec /opt/ruby/bin/ruby /var/task/runtime.rb",
];

/** The same Lambda and an asset upload, in CDK. Short to write, long to review. */
export const CDK_STACK = [
  'const web = new lambda.Function(this, "Web", {',
  "  runtime: lambda.Runtime.RUBY_3_4,",
  '  handler: "handler.handler",',
  '  code: lambda.Code.fromAsset("build"),',
  "});",
  'new s3deploy.BucketDeployment(this, "Assets", {',
  '  sources: [s3deploy.Source.asset("public")],',
  "  destinationBucket: assets,",
  "});",
];

/** What Terraform shows before it touches anything after a code change and a memory bump. */
export const TF_PLAN = [
  "# terraform plan",
  "  # aws_lambda_function.web will be updated in-place",
  '  ~ resource "aws_lambda_function" "web" {',
  "      ~ memory_size      = 512 -> 1024",
  '      ~ source_code_hash = "x9T2…" -> "Q2bk…"',
  "    }",
  "",
  "Plan: 0 to add, 1 to change, 0 to destroy.",
];

/** A project skill: the deploy recipe an agent follows, kept in the repo and reviewed like code. */
export const DEPLOY_SKILL = [
  "---",
  "name: deploy",
  "description: Ship the orders API to Lambda",
  "---",
  "1. Check the account: aws sts get-caller-identity",
  "2. Build gems in the Lambda build image",
  "3. Upload the zip, wait until it's updated",
  "4. Publish a version, point `live` at it",
  "5. Smoke test /up; if it fails, move `live` back",
  "6. Invalidate /assets/* on CloudFront",
  "Never create or delete resources. Ask first.",
];
