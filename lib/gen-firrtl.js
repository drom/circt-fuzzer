'use strict';

const rnd = require('random-js');

const range = n => Array.apply(null, Array(n));

const indent = n => {
  const pad = ' '.repeat(n);
  return text => text
    .split('\n')
    .map(line => ((line.trim === '') ? '' : pad) + line)
    .join('\n');
};

const wrapper = (topName, opt, body) => `; seed: ${opt.seed}
circuit ${topName} :
  module ${topName} :
${indent(4)(body)}
`;

const rndNode = (mt, nodes) =>
  nodes[rnd.integer(0, nodes.length - 1)(mt)];

const xint = node =>
  node.name + ': ' + (node.signed ? 'S' : 'U') +'Int<' + node.width + '>';

const binop = (type, mt, widther, signer) => nodes => {
  const args = [0, 1].map(() => rndNode(mt, nodes));
  if (args[0].signed !== args[1].signed) {
    args[1] = {
      type: args[1].signed ? 'asUInt' : 'asSInt',
      argument: args[1],
      width: args[1].width
    };
  }
  const width  = (typeof widther === 'function') ? widther(args) : widther;
  const signed = (typeof signer  === 'function') ? signer(args)  : signer;
  nodes.push({
    type: rnd.bool()(mt) ? 'output' : 'wire',
    name: 'tmp' + nodes.length,
    width, signed,
    argument: {
      type, width, signed,
      arguments: args
    }
  });
};

const unop = (type, mt, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes);
  const width  = (typeof widther === 'function') ? widther(arg) : widther;
  const signed = (typeof signer  === 'function') ? signer(arg)  : signer;
  nodes.push({
    type: rnd.bool()(mt) ? 'output' : 'wire',
    name: 'tmp' + nodes.length,
    width, signed,
    argument: {
      type, width, signed,
      argument: arg
    }
  });
};

const unoparam = (type, mt, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes);
  const p = rnd.integer(0, 100)(mt);
  const width  = (typeof widther === 'function') ? widther(arg, p) : widther;
  const signed = (typeof signer  === 'function') ? signer(arg)  : signer;
  nodes.push({
    type: rnd.bool()(mt) ? 'output' : 'wire',
    name: 'tmp' + nodes.length,
    width, signed,
    argument: {
      type, width, signed,
      arguments: [
        arg,
        {
          type: 'parameter',
          name: p
        }
      ]
    }
  });
};

const getOp = (mt, nodes) => {
  const opo = {
    add: binop('add', mt, a => Math.max(a[0].width, a[1].width) + 1, a => a[0].signed),
    sub: binop('sub', mt, a => Math.max(a[0].width, a[1].width) + 1, a => a[0].signed),
    mul: binop('mul', mt, a => a[0].width + a[1].width, a => a[0].signed),
    div: binop('div', mt, a => a[0].width + (a[0].signed ? 1 : 0), a => a[0].signed),
    rem: binop('rem', mt, a => Math.min(a[0].width, a[1].width), a => a[0].signed),

    lt:  binop('lt',  mt, 1, false),
    leq: binop('leq', mt, 1, false),
    gt:  binop('gt',  mt, 1, false),
    geq: binop('geq', mt, 1, false),
    eq:  binop('eq',  mt, 1, false),
    neq: binop('neq', mt, 1, false),

    // pad
    asUInt: unop('asUInt', mt, a => a.width, false),
    asSInt: unop('asSInt', mt, a => a.width, true),
    // asFixed
    // asCklock
    shl: unoparam('shl', mt, (a, p) => a.width + p, a => a.signed),
    shr: unoparam('shr', mt, (a, p) => Math.max(a.width - p, 1), a => a.signed),

    // second argument need to be narrow UInt
    // dshl: binop('dshl', mt, a => a[0].width + Math.pow(2, a[1].width) - 1, a => a[0].signed),

    // second argument need to be UInt
    // dshr: binop('dshr', mt, a => a[0].width, a => a[0].signed),

    cvt: unop('cvt', mt, a => a.width + (a.signed ? 0 : 1), true),
    neg: unop('neg', mt, a => a.width + 1, true),
    not: unop('not', mt, a => a.width, false),

    and: binop('and', mt, a => Math.max(a[0].width, a[1].width), false),
    or:  binop('or',  mt, a => Math.max(a[0].width, a[1].width), false),
    xor: binop('xor', mt, a => Math.max(a[0].width, a[1].width), false),

    andr: unop('andr', mt, 1, false),
    orr:  unop('orr',  mt, 1, false),
    xorr: unop('xorr', mt, 1, false),

    cat: binop('cat', mt, a => a[0].width + a[1].width, false)

    // bits
    // head
    // tail
    // incp
    // decp
    // setp

  };
  const ops = Object.keys(opo);
  return opo[ops[rnd.integer(0, ops.length - 1)(mt)]](nodes);
};


const emitPorter = (res, node) => {
  switch (node.type) {
  case 'input':
  case 'output':
    return res.concat(node.type + ' ' + xint(node));
  }
  return res;
};

const emitWirer = (res, node) => {
  switch (node.type) {
  case 'wire':
    return res.concat(node.type + ' ' + xint(node));
  }
  return res;
};

const emitBoder = (res, node) => {
  switch (node.type) {
  case 'input':
    return res;
  case 'output':
  case 'wire':
    return res.concat(node.name + ' <= ' + emit(node.argument));
  }
  return res.concat(JSON.stringify(node));
};

const getLut = str => str
  .trim()
  .split(/\s+/)
  .reduce((res, e) => {
    res[e.trim()] = true;
    return res;
  }, {});

const unaryLut = getLut(`
  pad
  asUInt  asSInt
  cvt
  neg  not
  andr  orr  xorr
`);

const multiLut = getLut(`
  add  sub
  mul  div  rem
  lt  leq  gt  geq  eq  neq
  shl  shr
  dshl dshr
  and  or  xor
  cat
  mux
`);

const emit = node => {
  if (unaryLut[node.type]) {
    return node.type
      + '('
      + emit(node.argument)
      + ')';
  }

  if (multiLut[node.type]) {
    return node.type
      + '('
      + node.arguments.map(arg => emit(arg)).join(', ')
      + ')';
  }
  return node.name;
};

const toString = nodes =>
  nodes.reduce(emitPorter, []).concat(
    nodes.reduce(emitWirer, []),
    nodes.reduce(emitBoder, [])
  )
    .join('\n');

const genBody = opt => {
  if (opt.v) { console.log(opt); }
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const inputs = range(rnd.integer(1, opt.I)(mt))
    .map((e, i) => ({
      type: 'input',
      name: 'inp_' + i.toString(36),
      width: rnd.integer(1, 100)(mt),
      signed: rnd.bool()(mt)
    }));

  const nodes = inputs.concat();
  const ilen = rnd.integer(1, opt.O)(mt);
  for (let i = 0; i < ilen; i++) {
    getOp(mt, nodes);
  }

  let res;
  try {
    res = toString(nodes);
  } catch (err) {
    console.error(err);
    res = JSON.stringify(nodes, null, 2);
  }
  return res;
};

module.exports = opt => {
  opt.seed = opt.seed || (10000 * Math.random()|0);
  console.log(wrapper('top_mod', opt, genBody(opt)));
};
