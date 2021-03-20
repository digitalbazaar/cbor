/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
export function encode(buf) {
  // eslint-disable-next-line
  return globalThis.btoa(new TextDecoder('utf8').decode(buf));
}

export function decode(s) {
  // eslint-disable-next-line
  const binary = globalThis.atob(s);
  const len = binary.length;
  const buf = new Uint8Array(len);
  for(let i = 0; i < len; ++i) {
    buf[i] = binary.charCodeAt(i);
  }
  return buf;
}
