import type { IncomingMessage } from 'node:http'
import type { Http2Stream, IncomingHttpHeaders } from 'node:http2'

import { all as allProxies, compile as compileTrust } from 'proxy-addr'


export type TrustFunction = ( addr: string, index: number ) => boolean;
export type TrustOption = TrustFunction | string | string[];

export interface ProxyOptions
{
	trust: TrustOption;
}

export interface ProxyTrace
{
	proxy?: string;
	intermediateProxies: string[];
	peer?: string;
}

function trueFunction( )
{
	return true;
}

function trustFunctionMaker( trust: TrustOption | undefined ): TrustFunction
{
	const userTrust: TrustFunction =
		typeof trust === 'function'
		? trust
		: !trust
		? trueFunction
		: compileTrust( trust );
	return userTrust;
}

function makeReqFromValues( remoteAddress: string, xForwardedFor?: string )
: IncomingMessage
{
	return (
		!!xForwardedFor
		? {
			headers: { 'x-forwarded-for': xForwardedFor },
			connection: { remoteAddress },
		}
		: {
			headers: { },
			connection: { remoteAddress },
		}
	) as IncomingMessage;
}

function makeReqFromStream( stream: Http2Stream, headers: IncomingHttpHeaders )
: IncomingMessage
{
	return {
		headers,
		connection: { remoteAddress: stream.session.socket.remoteAddress },
	} as IncomingMessage;
}

function parseAddresses( addrs: string[] ): ProxyTrace
{
	const peer = addrs.pop( );
	const proxy = addrs.length ? addrs.shift( ) : undefined;
	const intermediateProxies = addrs;

	return { peer, proxy, intermediateProxies };
}

export type TraceFunction =
	( remoteAddress: string, xForwardedFor?: string ) => ProxyTrace;
export type TraceReqFunction =
	( req: IncomingMessage ) => ProxyTrace;
export type TraceStreamFunction =
	( stream: Http2Stream, headers: IncomingHttpHeaders ) => ProxyTrace;

export function trace( options: Partial< ProxyOptions > = { } )
: TraceFunction
{
	const trust = trustFunctionMaker( options.trust );

	return function( remoteAddress: string, xForwardedFor?: string )
	: ProxyTrace
	{
		const req = makeReqFromValues( remoteAddress, xForwardedFor );
		return parseAddresses( allProxies( req, trust ) );
	};
}

export function traceReq( options: Partial< ProxyOptions > = { } )
: TraceReqFunction
{
	const trust = trustFunctionMaker( options.trust );

	return function( req: IncomingMessage ): ProxyTrace
	{
		return parseAddresses( allProxies( req, trust ) );
	};
}

export function traceStream( options: Partial< ProxyOptions > = { } )
: TraceStreamFunction
{
	const trust = trustFunctionMaker( options.trust );

	return function( stream: Http2Stream, headers: IncomingHttpHeaders )
	: ProxyTrace
	{
		const req = makeReqFromStream( stream, headers );
		return parseAddresses( allProxies( req, trust ) );
	};
}
