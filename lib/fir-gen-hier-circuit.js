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

const picker = mods => {
  return {
    someSource: mt => {
      let total = 0;
      const counts = mods.map(modP => {
        const mod = modP[irtl.identity];
        const defs = Object.keys(mod.defo);
        total += defs.length;
        return defs.length;
      });

      let idx = rnd.integer(0, total - 1)(mt);
      let res;
      counts.some((count, i) => {
        if (idx < count) {
          const modP = mods[i];
          const mod = modP[irtl.identity];
          const defs = Object.keys(mod.defo);
          res = modP[defs[idx]];
          return true;
        }
        idx -= count;
      });
      // console.log(idx, res);
      return res;
    }
  };
};

const makeSomeOps = (mods, opt, mt) => {
  const { xor } = irtl.elements;
  const pick = picker(mods);
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
    const src1 = pick.someSource(mt);
    const src2 = pick.someSource(mt);
    const dstMod = mods[rnd.integer(0, mods.length - 1)(mt)];
    const dstName = getName(rnd.integer(0, 0xfff)(mt));
    dstMod[dstName] = {width: Math.max(src1.width, src2.width)};
    dstMod[dstName] = xor(src1, src2);
    // const srcMod = mods[rnd.integer(0, mods.length - 1)(mt)];
    // const src1Name = getName(rnd.integer(0, 0xfff)(mt));
    // const src2Name = getName(rnd.integer(0, 0xfff)(mt));
    // dstMod[dstName] = xor(srcMod[src1Name, src2Name]);
  }
  // PRCI
  tb.clk = {type: 'Clock'};
  tb.arst = {width: 1};
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
  const res = '; seed: ' + opt.seed + '\n' + irtl.emitFirrtl(circt);
  // const res = irtl.emitVerilog(circt);
  return res;
};

module.exports = genHierCircuit;
