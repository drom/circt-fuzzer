'use strict';

const rnd = require('random-js');

const signage = mt => rnd.bool()(mt);

const rndLiteral = (mt, width, signed) => {
  const min = signed ? -Math.pow(2, Math.min(width - 1, 52)) : 0;
  const max = Math.pow(2, Math.min(width - (signed ? 1 : 0), 52)) - 1;
  return {
    type: signed ? 'SInt' : 'UInt',
    width, signed,
    value: rnd.integer(min, max)(mt)
  };
};

const rndNode = (mt, nodes, opt) => {
  if (opt.L && rnd.bool()(mt)) {
    return rndLiteral(mt, rnd.integer((opt.z ? 0 : 1), 31)(mt), signage(mt));
  } else {
    const node = nodes[rnd.integer(0, nodes.length - 1)(mt)];
    node.usage++;
    return node;
  }
};

module.exports = rndNode;
