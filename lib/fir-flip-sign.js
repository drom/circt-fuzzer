'use strict';

const flipSign = (mt, args, idx) => {
  const argument = args[idx];
  const {signed, width} = argument;
  args[idx] = {
    type: signed ? 'asUInt' : 'asSInt',
    signed: !signed,
    width,
    arguments: [argument]
  };
};

module.exports = flipSign;
