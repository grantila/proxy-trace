# proxy-trace

This package acts as a frontend to [`proxy-addr`](https://www.npmjs.com/package/proxy-addr). It can be used with custom remote address and header objects, or with Node.js' `req` (for HTTP/1) and the HTTP/2 `stream`.

Since it's based on `proxy-addr`, it uses the same options.

Its purpose is to provide access to the address of the remote peer, and understands proxies' `X-Forwarded-For` header to distinguish the proxy addresses from the end-user address.


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
    proxy, // string (or null)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( remoteAddress, xForwardedFor );
```

### `traceReq`

```ts
import { traceReq } from 'proxy-trace'

const tracer = traceReq( { trust: "127.0.0.1" } );

const {
    proxy, // string (or null)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( req );
```

### `traceStream`

```ts
import { traceStream } from 'proxy-trace'

const tracer = traceStream( { trust: "127.0.0.1" } );

const {
    proxy, // string (or null)
    intermediateProxies, // string[]
    peer, // string (or null)
} = tracer( stream, headers );
```
