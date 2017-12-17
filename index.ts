'use strict'

import { all as allProxies, compile as compileTrust } from 'proxy-addr'

import { IncomingMessage } from 'http'
import { Http2Stream, IncomingHttpHeaders } from 'http2'


export type TrustFunction = ( addr: string, index: number ) => boolean;
export type TrustOption = TrustFunction | string | string[];

export interface ProxyOptions
{
	trust: TrustOption;
}

const defaultOptions: ProxyOptions = Object.freeze( { trust: null } );

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

function trustFunctionMaker( trust: TrustOption ): TrustFunction
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
{
	return !!xForwardedFor
		? {
			headers: { 'x-forwarded-for': xForwardedFor },
			connection: { remoteAddress },
		}
		: {
			headers: { },
			connection: { remoteAddress },
		};
}

function makeReqFromStream( stream: Http2Stream, headers: IncomingHttpHeaders )
{
	return {
		headers,
		connection: { remoteAddress: stream.session.socket.remoteAddress },
	};
}

function parseAddresses( addrs: string[] ): ProxyTrace
{
	const address: ProxyTrace = {
		intermediateProxies: [ ]
	};

	const peer = addrs.shift( );
	const proxy = addrs.length ? addrs.shift( ) : null;
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
