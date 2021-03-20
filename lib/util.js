/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
export {inspect} from 'util';

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
