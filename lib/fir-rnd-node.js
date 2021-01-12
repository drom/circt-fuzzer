'use strict';

const rnd = require('random-js');
const rndLiteral = require('./rnd-literal.js');

const signage = mt => rnd.bool()(mt);

const rndNode = (mt, nodes, opt) => {
  if (opt.L && rnd.bool()(mt)) {
    return rndLiteral(mt, rnd.integer(1, 31)(mt), signage(mt));
  } else {
    const node = nodes[rnd.integer(0, nodes.length - 1)(mt)];
    node.usage++;
    return node;
  }
};

module.exports = rndNode;
