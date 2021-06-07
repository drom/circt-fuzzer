'use strict';

const rndNode = require('./fir-rnd-node.js');

const genVerif = keyWord =>
  (mt, opt) =>
    nodes => opt.verif && nodes.push({
      type: keyWord,
      items: [
        {name: 'clock'},
        {type: 'xorr', items: [rndNode(mt, nodes, opt)]},
        {type: 'xorr', items: [rndNode(mt, nodes, opt)]},
        {name: '"' + keyWord + nodes.length + '"'}
      ]
    });

module.exports = genVerif;
