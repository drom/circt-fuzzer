'use strict';

const rnd = require('random-js');
const rndNode = require('./fir-rnd-node.js');
const rndDigraph = require('./rnd-digraph.js');
const getClockName = require('./fir-get-clock-name.js');

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
    clock: getClockName(mt, opt),
    name: [prefix, 'state'].join('_'),
    width, signed
  };

  const g = rndDigraph(mt)({
    numNodes: numStates,
    numEdges: numTransitions
  });

  const next = {
    type: 'output',
    name: [prefix, 'next'].join('_'),
    width, signed,
    items: [{
      type: 'when', cases: g.map((n, ni) => ({
        cond: {
          type: 'eq', signed: false, width: 1, items: [
            state,
            {type: 'Int', width, signed, value: ni}
          ]
        },
        value: {
          type: 'when',
          cases: Object.keys(n.srco).map(e => ({
            cond: {
              type: 'xorr', signed: false, width: 1,
              items: [rndNode(mt, nodes, opt)]
            },
            value: {type: 'Int', width, signed, value: e}
          })).concat([{value: state}])
        }
      })).concat([{value: state}])
    }]
  };
  state.items = [next];
  nodes.push(next);
  nodes.push(state);
};

module.exports = genFsm;

/*
      trans = {
        type: 'output',
        name: [prefix, name(ni), name(e)].join('_'),
        width: 1, signed: false, usage: 1,
        items: [{
          type: 'mux',
          signed: false, width,
          items: [
            {
              type: 'and',
              signed: false, width: 1,
              items: [
                {
                  type: 'eq',
                  signed: false, width: 1,
                  items: [
                    state,
                    {type: 'Int', width, signed, value: ni}
                  ]
                },
                {
                  type: 'xorr',
                  signed: false, width: 1,
                  items: [
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
*/
