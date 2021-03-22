/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import chai from 'chai';
import chaiBytes from 'chai-bytes';
chai.should();
chai.use(chaiBytes);
const {expect} = chai;

import {encode, decode} from '..';
import tvPass from './test-vectors-pass.js';
import tvFail from './test-vectors-fail.js';
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
        // disable some tests due to round trip issues
        // difficult to force the input data into a specific form for encoding
        /* eslint-disable-next-line max-len */
        // https://github.com/hildjj/node-cbor/blob/main/packages/cbor/test/test-vectors.ava.js
        // https://github.com/cbor/test-vectors/issues/3
        if([
          '1bffffffffffffffff', // 18446744073709551615
          '3bffffffffffffffff', // -18446744073709551616
          'f90000', // 0.0
          'f90001', // 5.960464477539063e-08
          'f90400', // 6.103515625e-05
          'f93c00', // 1.0
          'f93e00', // 1.5
          'f97bff', // 65504.0
          'f9c400', // -4.0
          'fa47c35000' // 100000.0
        ].includes(t.hex)) {
          // expect failure to know when behavior changed
          expect(cborBytes).to.not.equalBytes(encodedCbor);
        } else {
          expect(cborBytes).to.equalBytes(encodedCbor);
        }
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
          'Invalid major type in indefinite encoding',
          'Invalid map length',
          'Invalid two-byte encoding of simple value',
          // FIXME
          '"parentBufferStream" not implemented.',
          // FIXME
          //'NoFilter is not defined'
          'Unexpected data',
          // FIXME
          'parent.write is not a function',
        ].join('|'), 'g'));
      });
    });
  });
});
