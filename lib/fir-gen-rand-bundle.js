'use strict';

const rnd = require('random-js');

const idFromNumber = n => {
  n = n >>> 0; // cast -> UInt32
  let res = '';
  for (let i = 0; i < 16; i++) {
    res += String.fromCharCode((n & 15) + 97);
    if (n < 16) { break; }
    n = n >>> 4;
  }
  return res;
};

const pRandSeq = (ilen, mt, opt) => {
  const res = [];
  for (let i = 0; i < ilen; i++) {
    res.push(opt.bundles ? rnd.integer(0, i)(mt) : 0);
  }
  return res;
};

const pTree = (seq, prefix, mt, opt) => {
  const root = {
    id: 'root',
    children: []
  };
  const nodes = [root];
  seq.map((n, i) => {
    const leaf = {
      id: prefix + idFromNumber(i),
      children: []
    };
    if (opt.vectors && (rnd.integer(0, 4)(mt) === 0)) {
      const dims = rnd.integer(1, 3)(mt);
      leaf.vec = [];
      for (let i = 0; i < dims; i++) {
        leaf.vec.push(rnd.integer(1, 5)(mt));
      }
    }
    nodes[n].children.push(leaf);
    nodes.push(leaf);
  });
  return root;
};

const addRandType = (node, mt, opt) => {
  if (node.children.length === 0) {
    // node.name = node.path.slice(1).join('.');
    node.width = rnd.integer((opt.z ? 0 : 1), opt.m)(mt);
    node.signed = rnd.bool()(mt);
  }
  node.children.map(e => addRandType(e, mt, opt));
};

const genRandBundle = (ilen, mt, opt, prefix) => {
  const seq = pRandSeq(ilen, mt, opt);
  const tree = pTree(seq, prefix, mt, opt);
  addRandType(tree, mt, opt);
  return tree;
};

module.exports = genRandBundle;
