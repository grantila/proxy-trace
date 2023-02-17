[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][build-image]][build-url]
[![coverage status][coverage-image]][coverage-url]

# proxy-trace

This package acts as a frontend to [`proxy-addr`](https://www.npmjs.com/package/proxy-addr). It can be used with custom remote address and header objects, or with Node.js' `req` (for HTTP/1) and the HTTP/2 `stream`.

Since it's based on `proxy-addr`, it uses the same options.

Its purpose is to provide access to the address of the remote peer, and understands proxies' `X-Forwarded-For` header to distinguish the proxy addresses from the end-user address.


## Versions

 * Since v2 this is a [pure ESM][pure-esm] package, and requires Node.js 16

## Exported function

`proxy-trace` exports three functions: `trace`, `traceReq`, `traceStream`.

They all take the same optional argument on the form:

```ts
{
    trust?: string | string[] | (string, number) => boolean;
}
```

The options object's only property `trust`, can be a string (IP address), an array of strings (IP addresses), or a function which takes an IP address and its index (in the proxy trace) and should return a boolean (wether to trust or not). This is exactly as the trust argument in `proxy-addr`.

These functions (`trace`, `traceReq` and `traceStream`) return a map function that converts a request into an object on the form:

```ts
{
    proxy?: string;                // The closest proxy (if any)
    intermediateProxies: string[]; // Any intermediate proxies
    peer?: string;                 // The remote peer (if trusted)
}
```

 * `trace` takes a remote address and an `X-Forwarded-For` header value: `(remoteAddress: string, xForwardedFor: string)`
 * `traceReq` takes a Node.js (HTTP/1) `req` object: `(req: IncomingMessage)`
 * `traceStream` takes a Node.js HTTP/2 stream and headers object: `(stream: Http2Stream, headers: IncomingHttpHeaders)`


## Usage

### `trace`

```ts
import { trace } from 'proxy-trace'

const tracer = trace( { trust: "127.0.0.1" } );

const {
    proxy, // string (or undefiend)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( remoteAddress, xForwardedFor );
```

### `traceReq`

```ts
import { traceReq } from 'proxy-trace'

const tracer = traceReq( { trust: "127.0.0.1" } );

const {
    proxy, // string (or undefiend)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( req );
```

### `traceStream`

```ts
import { traceStream } from 'proxy-trace'

const tracer = traceStream( { trust: "127.0.0.1" } );

const {
    proxy, // string (or undefiend)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( stream, headers );
```


[npm-image]: https://img.shields.io/npm/v/proxy-trace.svg
[npm-url]: https://npmjs.org/package/proxy-trace
[downloads-image]: https://img.shields.io/npm/dm/proxy-trace.svg
[build-image]: https://img.shields.io/github/actions/workflow/status/grantila/proxy-trace/master.yml?branch=master
[build-url]: https://github.com/grantila/proxy-trace/actions?query=workflow%3AMaster
[coverage-image]: https://coveralls.io/repos/github/grantila/proxy-trace/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/proxy-trace?branch=master
[pure-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
