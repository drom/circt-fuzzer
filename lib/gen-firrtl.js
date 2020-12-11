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
  value: rnd.integer(0, Math.pow(2, Math.min(width, 52)))(mt)
});

const rndNode = (mt, nodes) => {
  if (rnd.bool()(mt)) {
    return nodes[rnd.integer(0, nodes.length - 1)(mt)];
  } else {
    return rndLiteral(mt, rnd.integer(1, 52)(mt), rnd.bool()(mt));
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

const binop = (type, mt, widther, signer, opt) => nodes => {
  const args = [0, 1].map(() => rndNode(mt, nodes));

  if (opt === 'XU') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
  } else
  if (opt === 'Xu') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
    if (args[1].width > 10) {
      const resw = rnd.integer(1, 10)(mt);
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
      ? args[0].signed
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

const unop = (type, mt, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes);
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

const unoparam = (type, mt, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes);
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

const getOp = (mt, nodes) => {
  const opo = {
    add: binop('add', mt, a => Math.max(a[0].width, a[1].width) + 1),
    sub: binop('sub', mt, a => Math.max(a[0].width, a[1].width) + 1),
    mul: binop('mul', mt, a => a[0].width + a[1].width),
    // blocked by https://github.com/llvm/circt/issues/314
    div: binop('div', mt, a => a[0].width + (a[0].signed ? 1 : 0), a => a[0].signed),
    rem: binop('rem', mt, a => Math.min(a[0].width, a[1].width)),

    lt:  binop('lt',  mt, 1, false),
    leq: binop('leq', mt, 1, false),
    gt:  binop('gt',  mt, 1, false),
    geq: binop('geq', mt, 1, false),
    eq:  binop('eq',  mt, 1, false),
    neq: binop('neq', mt, 1, false),

    pad: unoparam('pad', mt, (a, p) => Math.max(a.width, p)),

    asUInt: unop('asUInt', mt, a => a.width, false),
    asSInt: unop('asSInt', mt, a => a.width, true),
    // asFixed
    // asCklock
    shl: unoparam('shl', mt, (a, p) => a.width + p),
    shr: unoparam('shr', mt, (a, p) => Math.max(a.width - p, 1)),

    dshl: binop('dshl', mt, a => a[0].width + Math.pow(2, a[1].width) - 1, null, 'Xu'),
    dshr: binop('dshr', mt, a => a[0].width, null, 'XU'),

    cvt: unop('cvt', mt, a => a.width + (a.signed ? 0 : 1), true),
    neg: unop('neg', mt, a => a.width + 1, true),
    not: unop('not', mt, a => a.width, false),

    and: binop('and', mt, a => Math.max(a[0].width, a[1].width), false),
    or:  binop('or',  mt, a => Math.max(a[0].width, a[1].width), false),
    xor: binop('xor', mt, a => Math.max(a[0].width, a[1].width), false),

    andr: unop('andr', mt, 1, false),
    orr:  unop('orr',  mt, 1, false),
    xorr: unop('xorr', mt, 1, false),

    cat: binop('cat', mt, a => a[0].width + a[1].width, false),

    // bits: unoparam('bits', mt, (a, p) => a.width + p, a => a.signed),
    // head
    // tail: unoparam('tail', mt, (a, p) => a.width - p, a => a.signed),
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
      width: rnd.integer(0, 1000)(mt),
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
    getOp(mt, nodes);
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
