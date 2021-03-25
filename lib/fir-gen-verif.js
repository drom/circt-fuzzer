'use strict';

const rndNode = require('./fir-rnd-node.js');

const genVerif = keyWord =>
  (mt, opt) =>
    nodes => opt.verif && nodes.push({
      type: keyWord,
      arguments: [
        {name: 'clock'},
        {type: 'xorr', arguments: [rndNode(mt, nodes, opt)]},
        {type: 'xorr', arguments: [rndNode(mt, nodes, opt)]},
        {name: '"' + keyWord + nodes.length + '"'}
      ]
    });

module.exports = genVerif;
