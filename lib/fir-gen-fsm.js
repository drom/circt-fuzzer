'use strict';

const rnd = require('random-js');
const rndNode = require('./fir-rnd-node.js');
const rndDigraph = require('./rnd-digraph.js');

const name = i => 'S' + Number(i).toString(36);

const genFsm = (mt, opt) => nodes => {
  if (!opt.fsms) {
    return;
  }
  const numStates = rnd.integer(2, 17)(mt);
  const numTransitions = rnd.integer(2, numStates * numStates)(mt);

  const width = Math.ceil(Math.log2(numStates));
  const signed = false;

  const prefix = 'fsm_' + nodes.length;

  const state = {
    type: 'rega',
    name: [prefix, 'state'].join('_'),
    width, signed
  };

  const next = {
    type: 'wire',
    name: [prefix, 'next'].join('_'),
    width, signed
  };
  state.arguments = [next];

  const g = rndDigraph(mt)({
    numNodes: numStates,
    numEdges: numTransitions
  });

  let trans = state;
  g.map((n, ni) => {
    Object.keys(n.srco).map(e => {
      trans = {
        type: 'wire',
        name: [prefix, name(ni), name(e)].join('_'),
        width: 1, signed: false, usage: 1,
        arguments: [{
          type: 'mux',
          signed: false, width,
          arguments: [
            {
              type: 'and',
              signed: false, width: 1,
              arguments: [
                {
                  type: 'eq',
                  signed: false, width: 1,
                  arguments: [
                    state,
                    {type: 'Int', width, signed, value: ni}
                  ]
                },
                {
                  type: 'xorr',
                  signed: false, width: 1,
                  arguments: [
                    rndNode(mt, nodes, opt)
                  ]
                }
              ]
            },
            {type: 'Int', width, signed, value: e},
            trans
          ]
        }]
      };
      nodes.push(trans);
    });
  });
  next.arguments = [trans];
  nodes.push(next);
  nodes.push(state);

};

module.exports = genFsm;
