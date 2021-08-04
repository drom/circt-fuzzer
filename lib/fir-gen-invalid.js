'use strict';

const rnd = require('random-js');

const wireRegOutput = require('./fir-wire-reg-output.js');

const genInvalid = (mt, opt) => nodes => {

  const width = rnd.integer(0, opt.m)(mt);
  const signed = rnd.bool()(mt);
  const valType = wireRegOutput(mt, width);

  if (valType === 'node') {
    return;
  }

  nodes.push({
    type: valType,
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    items: [{
      type: 'invalid',
      width, signed,
      items: []
    }]
  });
};

module.exports = genInvalid;
