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

const portEmitter = node => {
  switch (node.type) {
  // case 'input':
  case 'output':
    return [node.type + ' ' + xint(node)];
  }
  return [];
};


const getType = node => node.name + ': ' +
  ((node.children.length === 0)
    ? intw(node)
    : '{' + node.children.map(getType).join(', ') + '}'
  );


const inputEmitter = node => {
  return ['input ' + getType(node)];
};

const wireEmitter = node => {
  switch (node.type) {
  case 'wire':
    return ['wire' + ' ' + xint(node)];
  case 'reg':
    return ['reg' + ' ' + xint(node) + ', clock'];
  case 'regr':
    return ['reg' + ' ' + xint(node) + ', clock with: (reset => (reset, ' + intw(node) + '(0)))'];
  }
  return [];
};

const bodyEmitter = node => {
  switch (node.type) {
  case 'input':
    return [];
  case 'output':
  case 'wire':
  case 'reg':
  case 'regr':
    return [node.name + ' <= ' + emit(node.arguments[0])];
  }
  return [JSON.stringify(node)];
};

module.exports = mod => [].concat(
  mod.inputs.children.flatMap(inputEmitter),
  mod.body.flatMap(portEmitter),
  mod.body.flatMap(wireEmitter),
  mod.body.flatMap(bodyEmitter)
)
  .join('\n');
