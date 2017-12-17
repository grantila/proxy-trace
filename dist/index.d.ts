/// <reference types="node" />
import { IncomingMessage } from 'http';
import { Http2Stream, IncomingHttpHeaders } from 'http2';
export declare type TrustFunction = (addr: string, index: number) => boolean;
export declare type TrustOption = TrustFunction | string | string[];
export interface ProxyOptions {
    trust: TrustOption;
}
export interface ProxyTrace {
    proxy?: string;
    intermediateProxies: string[];
    peer?: string;
}
export declare type TraceFunction = (remoteAddress: string, xForwardedFor?: string) => ProxyTrace;
export declare type TraceReqFunction = (req: IncomingMessage) => ProxyTrace;
export declare type TraceStreamFunction = (stream: Http2Stream, headers: IncomingHttpHeaders) => ProxyTrace;
export declare function trace(options?: Partial<ProxyOptions>): TraceFunction;
export declare function traceReq(options?: Partial<ProxyOptions>): TraceReqFunction;
export declare function traceStream(options?: Partial<ProxyOptions>): TraceStreamFunction;
