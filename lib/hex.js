/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
export function encode(buf) {
  return Buffer.from(buf).toString('hex');
}

export function decode(s) {
  return Buffer.from(s, 'hex');
}
