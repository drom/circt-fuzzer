'use strict';

const getLut = str => str
  .trim()
  .split(/\s+/)
  .reduce((res, e) => {
    res[e.trim()] = true;
    return res;
  }, {});

const lut = getLut(`
  asUInt  asSInt
  cvt
  neg  not
  andr  orr  xorr

  bits tail head
  pad
  add  sub
  mul  div  rem
  lt  leq  gt  geq  eq  neq
  shl  shr
  dshl dshr
  and  or  xor
  cat
  mux validif
`);


const int = node => (node.signed ? 'S' : 'U') + 'Int';

const intw = node => int(node) + '<' + node.width + '>';

const intwlit = node => intw(node) + '(' + node.value + ')';

const xint = node =>
  node.name + ': ' + intw(node);

const emit = node => {
  if (node.type === 'Int') {
    return intwlit(node);
  }
  if (lut[node.type]) {
    return node.type
      + '('
      + node.arguments.map(arg => emit(arg)).join(', ')
      + ')';
  }
  return node.name;
};

const portEmitter = (res, node) => {
  switch (node.type) {
  case 'input':
  case 'output':
    return res.concat(node.type + ' ' + xint(node));
  }
  return res;
};

const wireEmitter = (res, node) => {
  switch (node.type) {
  case 'wire':
    return res.concat('wire' + ' ' + xint(node));
  case 'reg':
    return res.concat('reg' + ' ' + xint(node) + ', clock');
  case 'regr':
    return res.concat('reg' + ' ' + xint(node) + ', clock with: (reset => (reset, ' + intw(node) + '(0)))');
  }
  return res;
};

const bodyEmitter = (res, node) => {
  switch (node.type) {
  case 'input':
    return res;
  case 'output':
  case 'wire':
  case 'reg':
  case 'regr':
    return res.concat(node.name + ' <= ' + emit(node.arguments[0]));
  }
  return res.concat(JSON.stringify(node));
};

module.exports = nodes =>
  nodes.reduce(portEmitter, []).concat(
    nodes.reduce(wireEmitter, []),
    nodes.reduce(bodyEmitter, [])
  )
    .join('\n');
