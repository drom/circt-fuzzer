'use strict';

const rnd = require('random-js');

const wireRegOutput = require('./fir-wire-reg-output.js');
const rndNode = require('./fir-rnd-node.js');
const rndLiteral = require('./rnd-literal.js');
const flipSign = require('./fir-flip-sign.js');
const genBinop = require('./fir-gen-binop.js');
const genUnoparam = require('./fir-gen-unoparam.js');


const signed = mt => rnd.bool()(mt);

const genMux = (mt, opt) => nodes => {
  const args = [0, 1, 2].map(() => rndNode(mt, nodes, opt));
  if (args[1].signed !== args[2].signed) {
    flipSign(mt, args, rnd.integer(1, 2)(mt));
  }
  const width = Math.max(args[1].width, args[2].width);

  if (args[0].signed) {
    flipSign(mt, args, 0);
  }
  if (args[0].width === 0) {
    args[0] = rndLiteral(mt, rnd.integer(0, 1)(mt), rnd.bool()(mt));
  }
  if (args[0].width > 1) {
    args[0] = rnd.bool()(mt) ? {
      type: 'tail', width: 1,
      arguments: [args[0], {type: 'parameter', name: args[0].width - 1}]
    } : {
      type: 'head', width: 1,
      arguments: [args[0], {type: 'parameter', name: 1}]
    };
  }
  const signed = args[1].signed;
  nodes.push({
    type: wireRegOutput(mt),
    usage: 0,
    name: 'tmp' + nodes.length,
    width, signed,
    arguments: [{
      type: 'mux',
      width, signed,
      arguments: args
    }]
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
    type: wireRegOutput(mt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    arguments: [{
      type, width, signed,
      arguments: [arg]
    }]
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

    pad: unoparam('pad', 1, (a, p) => Math.max(a.width, p)),

    asUInt: unop('asUInt', a => a.width, false),
    asSInt: unop('asSInt', a => a.width, true),
    // asFixed
    // asCklock
    shl: unoparam('shl', 1, (a, p) => a.width + p),
    shr: unoparam('shr', 1, (a, p) => Math.max(a.width - p, 1)),

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

    cat: binop('cat', a => a[0].width + a[1].width, false), // 7.21

    bits: unoparam('bits', 2, (a, hi, lo) => hi - lo + 1, false), // 7.22
    head: unoparam('head', 1, (a, n) => n, false), // 7.23
    tail: unoparam('tail', 1, (a, p) => a.width - p, false), // 7.24
    // incp // 7.25
    // decp //
    // setp //
    mux: genMux(mt, opt)

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
      width: rnd.integer((opt.z ? 0 : 1), opt.m)(mt),
      signed: signed(mt),
      usage: 0
    });
  }
  return res;
};

const genBody = opt => {
  if (opt.v) { console.log(opt); }
  opt.seed = opt.seed || ((1000000 * Math.random()) |0);

  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  let nodes;
  do {
    nodes = genInputs(mt, opt);
    const ilen = rnd.integer(1, opt.O)(mt);
    for (let i = 0; i < ilen; i++) {
      getOp(mt, nodes, opt);
    }

    nodes = nodes.filter(n => !(
      ((n.type === 'input') || (n.type === 'wire')) &&
      (n.usage === 0)
    ));

  } while (!nodes.some(n => (n.type === 'output')));

  if (opt.n) {
    console.log(nodes.length);
  }
  return nodes;
};

module.exports = genBody;
