'use strict';

const rnd = require('random-js');

const genModule = require('./fir-gen-module.js');

const rec = mod => {
  mod._usedFromTop = (mod._usedFromTop || 0) + 1;
  mod.insts.map(inst => rec(inst.modo));
};

const removeUnusedModules = mods => {
  rec(mods[mods.length - 1]);
  return mods.filter(mod => mod._usedFromTop);
};

const genCircuit = (mt, opt) => {
  const modules = [];
  const nModules = rnd.integer(1, 5)(mt);
  for (let i = 0; i < nModules; i++) {
    genModule(mt, opt, modules);
  }
  const top = modules[modules.length - 1];
  top.name = 'top_mod';
  return (opt.unusedMods) ? modules : removeUnusedModules(modules);
};

module.exports = genCircuit;
