/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
import chaiBytes from 'chai-bytes';
chai.should();
chai.use(chaiBytes);
const {expect} = chai;

import {encode, decode} from '..';
import tvPass from './test-vectors-pass.js'
import tvFail from './test-vectors-fail.js'
import * as hex from '../lib/hex.js';
import * as base64 from '../lib/base64.js';

describe('CBOR', () => {
  //describe('constructor', () => {
  //  it('should exist', async () => {
  //    const ex = new Example();
  //    expect(ex).to.exist;
  //  });
  //});
  describe('test vectors', () => {
    tvPass.forEach((t, i) => {
      it(`[${i}] encoded data should be equal`, async function() {
        // check base64 and hex encoded inputs are equal
        const cborBytes = base64.decode(t.cbor);
        const hexBytes = hex.decode(t.hex);
        //console.log({cborBytes, hexBytes});
        expect(cborBytes).to.equalBytes(hexBytes);
      });
      it(`[${i}] should decode from 0x${t.hex}`, async function() {
        // check if decoded data available
        if(!('decoded' in t)) {
          this.skip();
          return;
        }
        // decode
        const cborBytes = base64.decode(t.cbor);
        const decodedCbor = decode(cborBytes);
        expect(decodedCbor).to.deep.equal(t.decoded);
      });
      it(`[${i}] should encode to 0x${t.hex}`, async function() {
        // check if decoded data available
        if(!('decoded' in t)) {
          this.skip();
          return;
        }
        if(t.roundtrip !== true) {
          this.skip();
          return;
        }
        // encode
        const cborBytes = base64.decode(t.cbor);
        const encodedCbor = encode(t.decoded);
        expect(cborBytes).to.equalBytes(encodedCbor);
      });
    });
  });
  describe('failure test vectors', () => {
    tvFail.forEach((t, i) => {
      it(`[${i}] should fail to decode 0x${t.hex}`, async function() {
        // decode
        const badCborBytes = hex.decode(t.hex);
        expect(() => {
          decode(badCborBytes);
        }).to.throw(RegExp([
          // allow known error patterns
          'Additional info not implemented',
          'Insufficient data',
          'Invalid BREAK',
          'Invalid indefinite encoding',
          'Invalid map length',
          'Invalid two-byte encoding of simple value',
          // FIXME
          //'NoFilter is not defined'
          'Unexpected data'
        ].join('|'), 'g'));
      });
    });
  });
});
