'use strict';

const rnd = require('random-js');

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
    //   items: [{
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

module.exports = genInsts;
