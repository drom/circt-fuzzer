'use strict';

const rnd = require('random-js');

const signed = mt => rnd.bool()(mt);

const rndLiteral = (mt, width, signed) => ({
  type: signed ? 'SInt' : 'UInt',
  width,
  signed,
  // value: signed
  //   ? rnd.integer(-Math.pow(2, Math.min(width - 1, 31)), Math.pow(2, Math.min(width - 1, 31)) - 1)(mt)
  //   : rnd.integer(0, Math.pow(2, Math.min(width, 32)) - 1)(mt)
  value: rnd.integer(0, Math.pow(2, Math.min(width - 1, 32)) - 1)(mt)
});

const rndNode = (mt, nodes, opt) => {
  if (opt.L && rnd.bool()(mt)) {
    return rndLiteral(mt, rnd.integer((opt.z ? 0 : 1), 31)(mt), signed(mt));
  } else {
    const node = nodes[rnd.integer(0, nodes.length - 1)(mt)];
    node.usage++;
    return node;
  }
};

module.exports = rndNode;
