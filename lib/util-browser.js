/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
/* eslint-env browser */
/* eslint-disable-next-line no-unused-vars */
export function inspect(data, options) {
  return JSON.stringify(data, null, 2);
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
