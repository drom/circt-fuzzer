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
const genFsm = require('./fir-gen-fsm.js');
const genInsts = require('./fir-gen-insts.js');
const traverse = require('./traverse.js');

const genSkip = () => nodes => nodes.push({type: 'skip', name: 'skip'});

const getOp = (mt, nodes, opt) => {
  const binop = genBinop(mt, opt);
  const unop = genUnop(mt, opt);
  const unoparam = genUnoparam(mt, opt);
  const opo = {
    fsm: genFsm(mt, opt),
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

    // div: binop('div', a => a[0].width + (a[0].signed ? 1 : 0), a => a[0].signed), // 7.4
    // rem: binop('rem', a => Math.min(a[0].width, a[1].width)), // 7.5

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
    /*
    // incp // 7.25
    // decp //
    // setp //
    */
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

const foreach = (vec, cb) => {
  if (!Array.isArray(vec) || (vec.length === 0)) {
    cb([]);
    return;
  }
  const dims = vec.length;
  for (let d0 = 0; d0 < vec[0]; d0++) {
    if (dims < 2) { cb([d0]); continue; }
    for (let d1 = 0; d1 < vec[1]; d1++) {
      if (dims < 3) { cb([d1, d0]); continue; }
      for (let d2 = 0; d2 < vec[2]; d2++) {
        if (dims < 4) { cb([d2, d1, d0]); continue; }
        throw new Error('too many dims ' + dims);
      }
    }
  }
};


const treeLeafs = tree => {
  const res = [];
  const rec = (node, path) => {
    foreach(node.vec, idx => {
      const pathNew = path.concat(node.id + idx.map(e => '[' + e + ']').join(''));
      // console.log(pathNew);
      if (node.children.length === 0) {
        node.type = 'input';
        node.name = pathNew.slice(1).join('.');
        node.usage = 0;
        res.push(node);
      } else {
        node.children.map(e => rec(e, pathNew));
      }
    });
  };
  rec(tree, []);
  return res;
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

  if (!opt.ordered) {
    const nlen = nodes.length;
    for (let i = 0; i < nlen; i++) {
      const ai = rnd.integer(0, nlen - 1)(mt);
      const bi = rnd.integer(0, nlen - 1)(mt);
      const tmp = nodes[ai];
      nodes[ai] = nodes[bi];
      nodes[bi] = tmp;
    }
  }

  if (opt.unsized) {
    nodes.map(node => {
      traverse(node, {
        enter: n => {
          if (
            (n.type === 'wire') ||
            (n.type === 'reg') ||
            (n.type === 'rega') ||
            (n.type === 'Int')
          ) {
            if (rnd.integer(0, 1)(mt) === 0) {
              n.width = undefined;
            }
          }
        }
      });
    });
  }

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
