'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_addr_1 = require("proxy-addr");
const defaultOptions = Object.freeze({ trust: null });
function trueFunction() {
    return true;
}
function trustFunctionMaker(trust) {
    const userTrust = typeof trust === 'function'
        ? trust
        : !trust
            ? trueFunction
            : proxy_addr_1.compile(trust);
    return userTrust;
}
function makeReqFromValues(remoteAddress, xForwardedFor) {
    return !!xForwardedFor
        ? {
            headers: { 'x-forwarded-for': xForwardedFor },
            connection: { remoteAddress },
        }
        : {
            headers: {},
            connection: { remoteAddress },
        };
}
function makeReqFromStream(stream, headers) {
    return {
        headers,
        connection: { remoteAddress: stream.session.socket.remoteAddress },
    };
}
function parseAddresses(addrs) {
    const address = {
        intermediateProxies: []
    };
    const peer = addrs.pop();
    const proxy = addrs.length ? addrs.shift() : null;
    const intermediateProxies = addrs;
    return { peer, proxy, intermediateProxies };
}
function trace(options = {}) {
    const trust = trustFunctionMaker(options.trust);
    return function (remoteAddress, xForwardedFor) {
        const req = makeReqFromValues(remoteAddress, xForwardedFor);
        return parseAddresses(proxy_addr_1.all(req, trust));
    };
}
exports.trace = trace;
function traceReq(options = {}) {
    const trust = trustFunctionMaker(options.trust);
    return function (req) {
        return parseAddresses(proxy_addr_1.all(req, trust));
    };
}
exports.traceReq = traceReq;
function traceStream(options = {}) {
    const trust = trustFunctionMaker(options.trust);
    return function (stream, headers) {
        const req = makeReqFromStream(stream, headers);
        return parseAddresses(proxy_addr_1.all(req, trust));
    };
}
exports.traceStream = traceStream;
//# sourceMappingURL=index.js.map