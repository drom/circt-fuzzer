'use strict';

const irtl = require('irtl');
const rnd = require('random-js');

// ************************************************** HIER

const getName = n => {
  let res = '';
  for (let i = 0; i < 16; i++) {
    res += String.fromCharCode((n & 15) + 97);
    n = n >>> 4;
    if (n === 0) {
      break;
    }
  }
  return res;
};

const pRandSeq = (length, mt) => Array.from({length})
  .map((e, i) =>
    (i === 0) ? 0 :
      (i === 1) ? 1 :
        rnd.integer(2, i)(mt));

const treeMix = (nums, mods) => {
  const root = [mods[0]];
  const nodes = [root];
  const ilen = nums.length - 1;
  for (let i = 0; i < ilen; i++) {
    const leaf = [mods[i + 1]];
    nodes[nums[i]].push(leaf);
    nodes.push(leaf);
  }
  return root;
};

const picker = (mods, mt) => curi => {
  if (rnd.integer(0, 1)(mt) > 0) { // 50% try local sources
    const modP = mods[curi];
    const mod = modP[irtl.identity];
    const defs = Object.keys(mod.defo);
    if (defs.length > 0) { // if local source exists
      const idx = rnd.integer(0, defs.length - 1)(mt);
      return modP[defs[idx]];
    }
  }
  // count definitions in all modules
  let total = 0;
  const counts = mods.map(modP => {
    const mod = modP[irtl.identity];
    const defs = Object.keys(mod.defo);
    const len = defs.length;
    total += len;
    return len;
  });
  let idx = rnd.integer(0, total - 1)(mt);
  for (const [i, count] of counts.entries()) {
    if (idx < count) {
      const modP = mods[i];
      const mod = modP[irtl.identity];
      const defs = Object.keys(mod.defo);
      return modP[defs[idx]];
    }
    idx -= count;
  }
};

const randOp = (mods, pick, mt) => {
  const elo = irtl.elements;
  const dstModIdx = rnd.integer(0, mods.length - 1)(mt);
  const src1 = pick(dstModIdx);
  const src2 = pick(dstModIdx);
  const dstMod = mods[dstModIdx];
  const dstName = getName(rnd.integer(0, 0xfff)(mt));

  const op = [elo.and, elo.or, elo.xor][rnd.integer(0, 2)(mt)];
  dstMod[dstName] = {width: Math.max(src1.width, src2.width)};
  dstMod[dstName] = op(src1, src2);
};

const makeSomeOps = (mods, opt, mt) => {
  const pick = picker(mods, mt);
  const tb = mods[0];
  // add some initial values
  for (let i = 0; i < opt.I; i++) {
    tb[getName(rnd.integer(0, 0xfff)(mt))] = {
      op: 'literal',
      width: rnd.integer(0, opt.m)(mt),
      value: 1
    };
  }
  for (let i = 0; i < opt.O; i++) {
    randOp(mods, pick, mt);
  }
  // PRCI
  tb.clk = {type: 'Clock'};
  tb.arst = {width: 1};
};

const unsize = (circuit, mt) => {
  circuit.items.map(mod => {
    mod.items.map(item => {
      if (rnd.bool()(mt)) {
        item.width = undefined;
      }
    });
  });
};

const genHierCircuit = (opt, mt) => {
  const nums = pRandSeq(opt.numMods, mt);
  const mods = nums.map((e, i) => {
    const name = (
      (i === 0) ? 'r' :
        (i === 1) ? 'top_mod' :
          getName(i)
    );
    return irtl.createModule(name);
  });
  makeSomeOps(mods, opt, mt);
  const mix = treeMix(nums, mods);
  const circt = irtl.createCircuit('top_mod', mix);

  opt.unsized && unsize(circt, mt);

  const res = '; seed: ' + opt.seed + '\n' + irtl.emitFirrtl(circt);
  // const res = irtl.emitVerilog(circt);
  return res;
};

module.exports = genHierCircuit;
