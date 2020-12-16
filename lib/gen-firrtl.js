'use strict';

const rnd = require('random-js');
const emitFIRRTL = require('./emit-firrtl.js');

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

const rndLiteral = (mt, width, signed) => ({
  type: signed ? 'SInt' : 'UInt',
  width,
  signed,
  value: rnd.integer(0, Math.pow(2, Math.min(width - 1, 31)))(mt)
});

const rndNode = (mt, nodes, opt) => {
  if (opt.L && rnd.bool()(mt)) {
    return rndLiteral(mt, rnd.integer((opt.z ? 0 : 1), 31)(mt), rnd.bool()(mt));
  } else {
    return nodes[rnd.integer(0, nodes.length - 1)(mt)];
  }
};

const flipSign = (mt, args, idx) => {
  args[idx] = {
    type: args[idx].signed ? 'asUInt' : 'asSInt',
    argument: args[idx],
    width: args[idx].width,
    signed: !args[idx].signed
  };
};

const genBinop = (mt, opt) => (type, widther, signer, fmt) => nodes => {
  const args = [0, 1].map(() => rndNode(mt, nodes, opt));

  if (fmt === 'XU') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
  } else
  if (fmt === 'Xu') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
    if (args[1].width > 10) {
      const resw = rnd.integer((opt.z ? 0 : 1), 10)(mt);
      args[1] = rnd.bool()(mt) ? {
        type: 'tail', width: resw,
        arguments: [args[1], {type: 'parameter', name: args[1].width - resw}]
      } : {
        type: 'head', width: resw,
        arguments: [args[1], {type: 'parameter', name: resw}]
      };
    }
  } else { // XX the same sign
    if (args[0].signed !== args[1].signed) {
      flipSign(mt, args, rnd.integer(0, 1)(mt));
    }
  }

  const width  = (typeof widther === 'function') ? widther(args) : widther;

  const signed = (typeof signer  === 'function')
    ? signer(args)
    : ((signer === null) || (signer === undefined))
      ? args[0].signed // default
      : signer;

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

const genUnop = (mt, opt) => (type, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const width  = (typeof widther === 'function') ? widther(arg) : widther;
  const signed = (typeof signer  === 'function')
    ? signer(arg)
    : ((signer === null) || (signer === undefined))
      ? arg.signed
      : signer;

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

const genUnoparam = (mt, opt) => (type, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const p = rnd.integer(0, 100)(mt);
  const width  = (typeof widther === 'function') ? widther(arg, p) : widther;

  const signed = (typeof signer  === 'function')
    ? signer(arg)
    : ((signer === null) || (signer === undefined))
      ? arg.signed
      : signer;

  nodes.push({
    type: rnd.bool()(mt) ? 'output' : 'wire',
    name: 'tmp' + nodes.length,
    width, signed,
    argument: {
      type, width, signed,
      arguments: [
        arg,
        {type: 'parameter', name: p}
      ]
    }
  });
};

const getOp = (mt, nodes, opt) => {
  const binop = genBinop(mt, opt);
  const unop = genUnop(mt, opt);
  const unoparam = genUnoparam(mt, opt);
  const opo = {
    add: binop('add', a => Math.max(a[0].width, a[1].width) + 1),
    sub: binop('sub', a => Math.max(a[0].width, a[1].width) + 1),
    mul: binop('mul', a => a[0].width + a[1].width),

    div: binop('div', a => a[0].width + (a[0].signed ? 1 : 0), a => a[0].signed),
    rem: binop('rem', a => Math.min(a[0].width, a[1].width)),

    lt:  binop('lt',  1, false),
    leq: binop('leq', 1, false),
    gt:  binop('gt',  1, false),
    geq: binop('geq', 1, false),
    eq:  binop('eq',  1, false),
    neq: binop('neq', 1, false),

    pad: unoparam('pad', (a, p) => Math.max(a.width, p)),

    asUInt: unop('asUInt', a => a.width, false),
    asSInt: unop('asSInt', a => a.width, true),
    // asFixed
    // asCklock
    shl: unoparam('shl', (a, p) => a.width + p),
    shr: unoparam('shr', (a, p) => Math.max(a.width - p, 1)),

    dshl: binop('dshl', a => a[0].width + Math.pow(2, a[1].width) - 1, null, 'Xu'),
    dshr: binop('dshr', a => a[0].width, null, 'Xu'),

    cvt: unop('cvt', a => a.width + (a.signed ? 0 : 1), true),
    neg: unop('neg', a => a.width + 1, true),
    not: unop('not', a => a.width, false),

    and: binop('and', a => Math.max(a[0].width, a[1].width), false),
    or:  binop('or',  a => Math.max(a[0].width, a[1].width), false),
    xor: binop('xor', a => Math.max(a[0].width, a[1].width), false),

    andr: unop('andr', 1, false),
    orr:  unop('orr',  1, false),
    xorr: unop('xorr', 1, false),

    cat: binop('cat', a => a[0].width + a[1].width, false),

    // bits: unoparam('bits', (a, p) => a.width + p, a => a.signed),
    // head
    // tail: unoparam('tail', (a, p) => a.width - p, a => a.signed),
    // incp
    // decp
    // setp

  };
  const ops = Object.keys(opo);
  return opo[ops[rnd.integer(0, ops.length - 1)(mt)]](nodes);
};

const genInputs = (mt, opt) => {
  const res = [];
  const ilen = rnd.integer(1, opt.I)(mt);
  for (let i = 0; i < ilen; i++) {
    res.push({
      type: 'input',
      name: 'inp_' + i.toString(36),
      width: rnd.integer((opt.z ? 0 : 1), 1000)(mt),
      signed: rnd.bool()(mt)
    });
  }
  return res;
};

const genBody = opt => {
  if (opt.v) { console.log(opt); }
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const nodes = genInputs(mt, opt);
  const ilen = rnd.integer(1, opt.O)(mt);
  for (let i = 0; i < ilen; i++) {
    getOp(mt, nodes, opt);
  }

  let res;
  try {
    res = emitFIRRTL(nodes);
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