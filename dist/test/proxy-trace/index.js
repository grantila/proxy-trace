'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const _1 = require("../../");
function makeProxyAddr(addrs) {
    return [...addrs].reverse().join(', ');
}
function makeReq(addr, proxies) {
    return (proxies)
        ? {
            headers: { 'x-forwarded-for': proxies },
            connection: { remoteAddress: addr },
        }
        : {
            headers: {},
            connection: { remoteAddress: addr },
        };
}
function makeStream(trace, addr, proxies) {
    const stream = { session: { socket: { remoteAddress: addr } } };
    const headers = (proxies
        ? { 'x-forwarded-for': proxies }
        : {});
    return trace(stream, headers);
}
describe('trace', () => {
    it('should get peer when no proxy', () => {
        const peer = "1.2.3.4";
        const tracer = _1.trace();
        const res = tracer(peer);
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.be.null;
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxy when one proxy', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2"];
        const tracer = _1.trace();
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxies when two proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3"];
        const tracer = _1.trace();
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
    it('should get peer and proxies when three proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3", "4.4.4.4"];
        const tracer = _1.trace();
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
    it('should handle function-based trust setting', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3", "4.4.4.4"];
        const tracer = _1.trace({ trust: () => true });
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
    it('should handle string-array-based trust setting', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3", "4.4.4.4"];
        const tracer = _1.trace({
            trust: ["1.2.3.4", "2.2.2.2/8", "4.4.4.4/8"]
        });
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies)
            .to.deep.equal(proxies.slice(1, 2));
    });
    it('should handle IPv6', () => {
        const peer = "[2001:db8:cafe::17]";
        const proxies = ["2.2.2.2", "[2001:db2:cafe::17]", "4.4.4.4"];
        const tracer = _1.trace();
        const res = tracer(peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
});
describe('traceReq', () => {
    it('should get peer when no proxy', () => {
        const peer = "1.2.3.4";
        const tracer = _1.traceReq();
        const res = tracer(makeReq(peer));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.be.null;
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxy when one proxy', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2"];
        const tracer = _1.traceReq();
        const res = tracer(makeReq(peer, makeProxyAddr(proxies)));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxies when two proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3"];
        const tracer = _1.traceReq();
        const res = tracer(makeReq(peer, makeProxyAddr(proxies)));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
    it('should get peer and proxies when three proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3", "4.4.4.4"];
        const tracer = _1.traceReq();
        const res = tracer(makeReq(peer, makeProxyAddr(proxies)));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
});
describe('traceStream', () => {
    it('should get peer when no proxy', () => {
        const peer = "1.2.3.4";
        const tracer = _1.traceStream();
        const res = makeStream(tracer, peer);
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.be.null;
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxy when one proxy', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2"];
        const tracer = _1.traceStream();
        const res = makeStream(tracer, peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.be.empty;
    });
    it('should get peer and proxies when two proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3"];
        const tracer = _1.traceStream();
        const res = makeStream(tracer, peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
    it('should get peer and proxies when three proxies', () => {
        const peer = "1.2.3.4";
        const proxies = ["2.2.2.2", "3.3.3.3", "4.4.4.4"];
        const tracer = _1.traceStream();
        const res = makeStream(tracer, peer, makeProxyAddr(proxies));
        chai_1.expect(res.peer).to.equal(peer);
        chai_1.expect(res.proxy).to.equal(proxies[0]);
        chai_1.expect(res.intermediateProxies).to.deep.equal(proxies.slice(1));
    });
});
//# sourceMappingURL=index.js.map