/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {Encoder} from './Encoder.js';
import {Decoder} from './Decoder.js';

export {Encoder, Decoder};
export const encode = Encoder.encode;
export const decode = Decoder.decodeFirstSync;
