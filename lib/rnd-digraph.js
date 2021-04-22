'use strict';

const rnd = require('random-js');

module.exports = mt => props => {
  const numNodes = props.numNodes || 2;
  const numEdges = props.numEdges || 3;
  const nodes = [];
  for (let i = 0; i < numNodes; i++) {
    nodes.push({srco: {}, dsto: {}});
  }
  let state = 0;
  let curNumEdges = 0;
  while (curNumEdges < numEdges) {
    const next = rnd.integer(0, numNodes - 1)(mt);
    if (nodes[state].srco[next] === undefined) {
      nodes[state].srco[next] = 0;
      nodes[next].dsto[state] = 0;
      curNumEdges += 1;
    }
    nodes[state].srco[next] += 1;
    nodes[next].dsto[state] += 1;
    state = next;
  }
  return nodes;
};
