'use strict';

const rnd = require('random-js');

const rndLiteral = (mt, width, signed) => {
  const min = signed ? -Math.pow(2, Math.min(width - 1, 52)) : 0;
  const max = Math.pow(2, Math.min(width - (signed ? 1 : 0), 52)) - 1;
  return {
    type: signed ? 'SInt' : 'UInt',
    width, signed,
    value: rnd.integer(min, max)(mt)
  };
};

module.exports = rndLiteral;
