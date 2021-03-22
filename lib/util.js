/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {BigNumber} from 'bignumber.js';
import * as base64 from './base64.js';
import * as base64url from 'base64url';
import * as hex from './hex.js';
import {NUMBYTES, SHIFT32, BI, MAX_SAFE_HIGH} from './constants.js';

// eslint-disable-next-line no-undef
const {BigInt} = globalThis;

export {inspect} from './inspect.js';

const SUPPORTED_ENCODINGS = new Map([
  ['base64', base64],
  ['base64url', base64url],
  ['hex', hex]
]);

export class BufferStream {
  constructor({input, encoding}) {
    if(!encoding) {
      this.bytes = input;
    } else {
      const lib = SUPPORTED_ENCODINGS.get(encoding);
      if(!lib) {
        throw new Error(`Unsupported encoding "${encoding}".`);
      }
      this.bytes = lib.decode(input);
    }
    this.index = 0;
  }

  get length() {
    return this.bytes.length - this.index;
  }

  read(count = this.length) {
    count = Math.min(count, this.length);
    if(count === 0) {
      return null;
    }
    const {bytes} = this;
    const view = new Uint8Array(
      bytes.buffer, bytes.byteOffset + this.index, count);
    this.index += count;
    return view;
  }

  unshift(bytes) {
    // FIXME: actual `bytes` value is ignored, only rewinds using length
    if(bytes.length > this.index) {
      throw new Error('Cannot rewind that far.');
    }
    this.index -= bytes.length;
  }
}

export function bufferToBigNumber(buf) {
  return new BigNumber(hex.encode(buf), 16);
}

export function bufferToBigInt(buf) {
  return BigInt(`0x${hex.encode(buf)}`);
}

export function bufferishToBuffer(b) {
  if(b instanceof Uint8Array) {
    return b;
  }
  if(ArrayBuffer.isView(b)) {
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  }
  if(b instanceof ArrayBuffer) {
    return new Uint8Array(b);
  }
  return null;
}

export function concatBuffers(bufs) {
  let len = 0;
  for(const buf of bufs) {
    len += buf.length;
  }

  const result = new Uint8Array(len);
  let idx = 0;
  for(const buf of bufs) {
    result.set(buf, idx);
    idx += buf.length;
  }
  return result;
}

/**
 * Convert a UTF8-encoded Uint8Array to a JS string.  If possible, throw an
 * error on invalid UTF8.  Byte Order Marks are not looked at or stripped.
 */
const td = new TextDecoder('utf8', {fatal: true, ignoreBOM: true});
export function stringFromUtf8Bytes(buf) {
  return td.decode(buf);
}

export function guessEncoding(input, encoding) {
  return new BufferStream({input, encoding});
  // FIXME: previous implementation
  /*
  if(typeof input === 'string') {
    return new NoFilter(input, (encoding != null) ? encoding : 'hex')
  }
  const buf = exports.bufferishToBuffer(input)
  if (buf) {
    return new NoFilter(buf)
  }
  if(isReadable(input)) {
    return input
  }
  throw new Error('Unknown input type');*/
}

export function isBigEndian() {
  const array = new Uint8Array(4);
  const view = new Uint32Array(array.buffer);
  return !((view[0] = 1) & array[0]);
}

export function isBufferish(b) {
  return b && ((b instanceof Uint8Array) ||
    (b instanceof Uint8ClampedArray) ||
    (b instanceof ArrayBuffer) ||
    (b instanceof DataView));
}

export function parseCBORfloat(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  switch(buf.length) {
    case 2:
      return parseHalf(buf);
    case 4:
      return dv.getFloat32(0);
    case 8:
      return dv.getFloat64(0);
    default:
      throw new Error('Invalid float size: ' + buf.length);
  }
}

export function parseCBORint(ai, buf, bigInt = true) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  switch(ai) {
    case NUMBYTES.ONE:
      return dv.getUint8(0);
    case NUMBYTES.TWO:
      return dv.getUint16(0);
    case NUMBYTES.FOUR:
      return dv.getUint32(0);
    case NUMBYTES.EIGHT: {
      const f = dv.getUint32(0);
      const g = dv.getUint32(4);
      if(f > MAX_SAFE_HIGH) {
        if(bigInt) {
          return (BigInt(f) * BI.SHIFT32) + BigInt(g);
        }
        return new BigNumber(f)
          .times(SHIFT32)
          .plus(g);
      }
      return (f * SHIFT32) + g;
    }
    default:
      throw new Error('Invalid additional info for int: ' + ai);
  }
}

export function parseHalf(buf) {
  const sign = buf[0] & 0x80 ? -1 : 1;
  const exp = (buf[0] & 0x7C) >> 2;
  const mant = ((buf[0] & 0x03) << 8) | buf[1];
  if(!exp) {
    return sign * 5.9604644775390625e-8 * mant;
  }
  if(exp === 0x1f) {
    // eslint-disable-next-line no-loss-of-precision
    return sign * (mant ? 0 / 0 : 2e308);
  }
  return sign * Math.pow(2, exp - 25) * (1024 + mant);
}

export function writeHalf(buf, half) {
  // assume 0, -0, NaN, Infinity, and -Infinity have already been caught

  // HACK: everyone settle in.  This isn't going to be pretty.
  // Translate cn-cbor's C code (from Carsten Borman):

  // uint32_t be32;
  // uint16_t be16, u16;
  // union {
  //   float f;
  //   uint32_t u;
  // } u32;
  // u32.f = float_val;

  const u32 = new Uint8Array(4);
  let dv = new DataView(u32.buffer, u32.byteOffset, u32.length);
  dv.setFloat32(0, half);
  const u = dv.getUint32(0);

  // if ((u32.u & 0x1FFF) == 0) { /* worth trying half */

  // hildjj: If the lower 13 bits aren't 0,
  // we will lose precision in the conversion.
  // mant32 = 24bits, mant16 = 11bits, 24-11 = 13
  if((u & 0x1FFF) !== 0) {
    return false;
  }

  //   int s16 = (u32.u >> 16) & 0x8000;
  //   int exp = (u32.u >> 23) & 0xff;
  //   int mant = u32.u & 0x7fffff;

  let s16 = (u >> 16) & 0x8000; // top bit is sign
  const exp = (u >> 23) & 0xff; // then 5 bits of exponent
  const mant = u & 0x7fffff;

  //   if (exp == 0 && mant == 0)
  //     ;              /* 0.0, -0.0 */

  // hildjj: zeros already handled.  Assert if you don't believe me.

  //   else if (exp >= 113 && exp <= 142) /* normalized */
  //     s16 += ((exp - 112) << 10) + (mant >> 13);

  if((exp >= 113) && (exp <= 142)) {
    s16 += ((exp - 112) << 10) + (mant >> 13);
  } else if((exp >= 103) && (exp < 113)) {
    //   else if (exp >= 103 && exp < 113) { /* denorm, exp16 = 0 */
    //     if (mant & ((1 << (126 - exp)) - 1))
    //       goto float32;         /* loss of precision */
    //     s16 += ((mant + 0x800000) >> (126 - exp));

    if(mant & ((1 << (126 - exp)) - 1)) {
      return false;
    }
    s16 += ((mant + 0x800000) >> (126 - exp));
  } else {
  //   } else if (exp == 255 && mant == 0) { /* Inf */
  //     s16 += 0x7c00;

    // hildjj: Infinity already handled

    //   } else
    //     goto float32;           /* loss of range */

    return false;
  }

  //   ensure_writable(3);
  //   u16 = s16;
  //   be16 = hton16p((const uint8_t*)&u16);
  dv = new DataView(buf.buffer, buf.byteOffset, buf.length);
  dv.setUint16(0, s16);
  return true;
}
