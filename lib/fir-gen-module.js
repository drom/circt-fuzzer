'use strict';

const rnd = require('random-js');

const genBinop = require('./fir-gen-binop.js');
const genUnoparam = require('./fir-gen-unoparam.js');
const genValidif = require('./fir-gen-validif.js');
const genMux = require('./fir-gen-mux.js');
const genUnop = require('./fir-gen-unop.js');
const genConnect = require('./fir-gen-connect.js');
const genRandBundle = require('./fir-gen-rand-bundle.js');
const genVerif = require('./fir-gen-verif.js');
const genMem = require('./fir-gen-mem.js');

const genSkip = () => nodes => nodes.push({type: 'skip', name: 'skip'});

const getOp = (mt, nodes, opt) => {
  const binop = genBinop(mt, opt);
  const unop = genUnop(mt, opt);
  const unoparam = genUnoparam(mt, opt);
  const opo = {
    connect: genConnect(mt, opt), // 3.2

    skip: genSkip(mt, opt), // 5.4

    mem: genMem(mt, opt), // 5.11

    assert: genVerif('assert')(mt, opt), // 5.15.1
    assume: genVerif('assume')(mt, opt), // 5.15.2
    cover:  genVerif('cover')(mt, opt), // 5.15.3

    mux: genMux(mt, opt), // 6.9
    validif: genValidif(mt, opt), // 6.10

    add: binop('add', a => Math.max(a[0].width, a[1].width) + 1), // 7.1
    sub: binop('sub', a => Math.max(a[0].width, a[1].width) + 1), // 7.2
    mul: binop('mul', a => a[0].width + a[1].width), // 7.3

    div: binop('div', a => a[0].width + (a[0].signed ? 1 : 0), a => a[0].signed), // 7.4
    rem: binop('rem', a => Math.min(a[0].width, a[1].width)), // 7.5

    lt:  binop('lt',  1, false), // 7.6
    leq: binop('leq', 1, false),
    gt:  binop('gt',  1, false),
    geq: binop('geq', 1, false),
    eq:  binop('eq',  1, false),
    neq: binop('neq', 1, false),

    pad: unoparam('pad', 1, (a, p) => Math.max(a.width, p)), // 7.7

    asUInt: unop('asUInt', a => a.width, false), // 7.8
    asSInt: unop('asSInt', a => a.width, true), // 7.9
    // asFixed // 7.10
    // asCklock // 7.11
    shl: unoparam('shl', 1, (a, p) => a.width + p), // 7.12
    shr: unoparam('shr', 1, (a, p) => Math.max(a.width - p, 1)), // 7.13

    dshl: binop('dshl', a => a[0].width + Math.pow(2, a[1].width) - 1, null, 'Xu'), // 7.14
    dshr: binop('dshr', a => a[0].width, null, 'Xu'), // 7.15

    cvt: unop('cvt', a => a.width + (a.signed ? 0 : 1), true), // 7.16
    neg: unop('neg', a => a.width + 1, true), // 7.17
    not: unop('not', a => a.width, false), // 7.18

    and: binop('and', a => Math.max(a[0].width, a[1].width), false), // 7.19
    or:  binop('or',  a => Math.max(a[0].width, a[1].width), false),
    xor: binop('xor', a => Math.max(a[0].width, a[1].width), false),

    andr: unop('andr', 1, false), // 7.20
    orr:  unop('orr',  1, false),
    xorr: unop('xorr', 1, false),

    cat: binop('cat', a => a[0].width + a[1].width, false), // 7.21

    bits: unoparam('bits', 2, (a, hi, lo) => hi - lo + 1, false), // 7.22
    head: unoparam('head', 1, (a, n) => n, false), // 7.23
    tail: unoparam('tail', 1, (a, p) => a.width - p, false) // 7.24
    // incp // 7.25
    // decp //
    // setp //
  };
  const ops = Object.keys(opo);
  return opo[ops[rnd.integer(0, ops.length - 1)(mt)]](nodes);
};


// const genInputs = (mt, opt) => {
//   const res = [];
//   const ilen = rnd.integer(1, opt.I)(mt);
//   for (let i = 0; i < ilen; i++) {
//     res.push({
//       type: 'input',
//       name: 'inp_' + i.toString(36),
//       width: rnd.integer((opt.z ? 0 : 1), opt.m)(mt),
//       signed: signed(mt),
//       usage: 0
//     });
//   }
//   return res;
// };


const treeLeafs = tree => {
  const res = [];
  const rec = (node, path) => {
    const pathNew = path.concat(node.id);
    // console.log(pathNew);
    if (node.children.length === 0) {
      node.type = 'input';
      node.name = pathNew.slice(1).join('.');
      node.usage = 0;
      res.push(node);
    } else {
      node.children.map(e => rec(e, pathNew));
    }
  };
  rec(tree, []);
  return res;
};

const genInsts = (mt, mods, nodes, opt) => {
  // const connector = genConnect(mt, opt);
  if (mods.length === 0) {
    return [];
  }
  if (!opt.instances) {
    return [];
  }
  const insts = [];
  const nInst = rnd.integer(0, 3)(mt);
  for (let i = 0; i < nInst; i++) {
    const modo = mods[rnd.integer(0, mods.length - 1)(mt)];
    // nodes.push({
    //   type: 'inst',
    //   name: 'U' + i + '.reset',
    //   width: 1,
    //   usage: 0,
    //   arguments: [{
    //     type: 'wire',
    //     name: 'reset'
    //   }]
    // });
    insts.push({
      type: 'inst',
      name: 'U' + i,
      usage: 0,
      modo
    });
  }
  return insts;
};

const genBody = (mt, opt, mods) => {
  let nodes, inputs, temps, insts;
  do {
    inputs = genRandBundle(opt.I, mt, opt, 'inp_');
    nodes = treeLeafs(inputs);
    insts = genInsts(mt, mods, nodes, opt); // 5.12
    temps = genRandBundle(opt.O, mt, opt, 'tmp_');
    const ilen = rnd.integer(1, opt.O)(mt);
    for (let i = 0; i < ilen; i++) {
      getOp(mt, nodes, opt);
    }

    nodes = nodes.filter(n => !(
      ((n.type === 'input') || (n.type === 'wire') || (n.type === 'reg')) &&
      (n.usage === 0)
    ));

  } while (!nodes.some(n => (n.type === 'output')));

  if (opt.n) { console.log(nodes.length); }

  mods.push({
    type: 'module',
    name: 'mod_' + mods.length,
    body: nodes,
    inputs,
    temps,
    insts
  });
};

module.exports = genBody;
