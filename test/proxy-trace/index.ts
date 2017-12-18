'use strict';

import 'mocha';
import { expect } from 'chai';

import {
	trace,
	traceReq,
	traceStream,
	TraceStreamFunction,
	ProxyTrace,
} from '../../';

import { IncomingMessage } from 'http'
import { Http2Stream, IncomingHttpHeaders } from 'http2'

function makeProxyAddr( addrs: ReadonlyArray< string > )
{
	return addrs.join( ', ' );
}

function makeReq( addr: string, proxies?: string )
{
	return ( proxies )
		? {
			headers: { 'x-forwarded-for': proxies },
			connection: { remoteAddress: addr },
		} as any as IncomingMessage
		: {
			headers: { },
			connection: { remoteAddress: addr },
		} as any as IncomingMessage;
}

function makeStream(
	trace: TraceStreamFunction,
	addr: string,
	proxies?: string
)
: ProxyTrace
{
	const stream =
		{ session: { socket: { remoteAddress: addr } } } as any as Http2Stream;
	const headers =
		(
			proxies
			? { 'x-forwarded-for': proxies }
			: { }
		) as any as IncomingHttpHeaders;

	return trace( stream, headers );
}

describe( 'trace', ( ) =>
{
	it( 'should get peer when no proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const tracer = trace( );
		const res = tracer( peer );
		expect( res.peer ).to.equal( peer );
		expect( res.proxy ).to.be.null;
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxy when one proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2" ];
		const tracer = trace( );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxies when two proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3" ];
		const tracer = trace( );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.deep.equal( proxies.slice( 1 ) );
	} );

	it( 'should get peer and proxies when three proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3", "4.4.4.4" ];
		const tracer = trace( );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 1 ).reverse( ) );
	} );

	it( 'should handle function-based trust setting', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3", "4.4.4.4" ];
		const tracer = trace( { trust: ( ) => true } );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 1 ).reverse( ) );
	} );

	it( 'should handle string-array-based trust setting', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3", "4.4.4.4" ];
		const tracer = trace( {
			trust: [ "1.2.3.4", "2.2.2.2/8", "4.4.4.4/8" ]
		} );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( "3.3.3.3" );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 2 ) );
	} );

	it( 'should handle IPv6', ( ) =>
	{
		const peer = "[2001:db8:cafe::17]";
		const proxies = [ "2.2.2.2", "[2001:db2:cafe::17]", "4.4.4.4" ];
		const tracer = trace( );
		const res = tracer( peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 1 ).reverse( ) );
	} );
} );

describe( 'traceReq', ( ) =>
{
	it( 'should get peer when no proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const tracer = traceReq( );
		const res = tracer( makeReq( peer ) );
		expect( res.peer ).to.equal( peer );
		expect( res.proxy ).to.be.null;
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxy when one proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2" ];
		const tracer = traceReq( );
		const res = tracer( makeReq( peer, makeProxyAddr( proxies ) ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxies when two proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3" ];
		const tracer = traceReq( );
		const res = tracer( makeReq( peer, makeProxyAddr( proxies ) ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.deep.equal( proxies.slice( 1 ) );
	} );

	it( 'should get peer and proxies when three proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3", "4.4.4.4" ];
		const tracer = traceReq( );
		const res = tracer( makeReq( peer, makeProxyAddr( proxies ) ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 1 ).reverse( ) );
	} );
} );

describe( 'traceStream', ( ) =>
{
	it( 'should get peer when no proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const tracer = traceStream( );
		const res = makeStream( tracer, peer );
		expect( res.peer ).to.equal( peer );
		expect( res.proxy ).to.be.null;
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxy when one proxy', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2" ];
		const tracer = traceStream( );
		const res = makeStream( tracer, peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.be.empty;
	} );

	it( 'should get peer and proxies when two proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3" ];
		const tracer = traceStream( );
		const res = makeStream( tracer, peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies ).to.deep.equal( proxies.slice( 1 ) );
	} );

	it( 'should get peer and proxies when three proxies', ( ) =>
	{
		const peer = "1.2.3.4";
		const proxies = [ "2.2.2.2", "3.3.3.3", "4.4.4.4" ];
		const tracer = traceStream( );
		const res = makeStream( tracer, peer, makeProxyAddr( proxies ) );
		expect( res.peer ).to.equal( proxies[ 0 ] );
		expect( res.proxy ).to.equal( peer );
		expect( res.intermediateProxies )
			.to.deep.equal( proxies.slice( 1 ).reverse( ) );
	} );
} );
