'use strict';

// shallow graph traverse
const traverse = (n0, cbs) => {
  const enter = cbs.enter || (() => {});
  const leave = cbs.leave || (() => {});
  enter(n0);
  (n0.items || []).map(n1 => {
    enter(n1);
    (n1.items || []).map(n2 => {
      enter(n2);
      leave(n2);
    });
    leave(n1);
  });
  leave(n0);
};

module.exports = traverse;
