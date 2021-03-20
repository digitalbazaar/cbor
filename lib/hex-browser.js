/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
export function encode(buf) {
  let s = '';
  for(let i = 0; i < buf.length; ++i) {
    if(buf[i] < 16) {
      s += '0';
    }
    s += buf[i].toString(16);
  }
  return s;
}

export function decode(s) {
  const pairs = s.match(/.{1,2}/g);
  const buf = new Uint8Array(pairs.length);
  let idx = 0;
  for(const pair of pairs) {
    buf[idx++] = parseInt(pair, 16);
  }
  return buf;
}
