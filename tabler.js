'use strict';

const {replace} = '';

const es = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;

const unes = {
  '&amp;': '&',
  '&#38;': '&',
  '&lt;': '<',
  '&#60;': '<',
  '&gt;': '>',
  '&#62;': '>',
  '&apos;': '\'',
  '&#39;': '\'',
  '&quot;': '"',
  '&#34;': '"'
};

const cape = m => unes[m];

const unescape = un => replace.call(un, es, cape);

const stringify = obj =>
  Object.keys(obj).reduce(
    (res, key) => res.concat(key + ': ' + obj[key]),
    []
  ).join(', ');

const scoper = (acc, e) => {
  if (acc[e] === undefined) {
    acc[e] = 0;
  }
  acc[e] += 1;
  return acc;
};

const matcher = (txt, regexp1, regexp2, klass, root) => {
  const m = txt.match(regexp1);
  if (m) {
    const el = document.createElement('span');
    el.innerHTML = stringify(m
      .map(e => e.match(regexp2)[1])
      .reduce(scoper, {})
    );
    el.classList.add(klass);
    root.appendChild(el);
  }
};

const lint = root => {
  if (root === undefined) {
    return;
  }
  const txt = root.innerHTML.trim();
  root.innerHTML = '';
  if (txt === '') {
    return;
  }
  matcher(txt, /%Warning-(\w+):/g, /%Warning-(\w+):/, 'warning', root);
  matcher(txt, /%Error-(\w+):/g, /%Error-(\w+):/, 'error', root);
  root.addEventListener('click', () => console.log(unescape(txt)));
};

const othr = root => {
  if (root === undefined) {
    return;
  }
  const txt = root.innerHTML.trim();
  root.innerHTML = '';
  if (txt === '') {
    return;
  }
  root.addEventListener('click', () => console.log(unescape(txt)));
  if (txt.match(/timeout/)) {
    root.innerHTML = 'T';
    root.classList.add('timeout');
    return;
  }
  const m1 = txt.match(/ERROR: Found (\d+) unproven/);
  if (m1) {
    root.innerHTML = m1[1];
    root.classList.add('unproven');
    return;
  }
  if (txt.match(/proof did fail/)) {
    root.innerHTML = 'fail';
    root.classList.add('fail');
    return;
  }
  root.innerHTML = 'Click';
  root.classList.add('error');
};

const main = () => {
  const table = document.getElementById('log');
  const trs = table.children[0].children;
  const trLen = trs.length;
  for (let iTr = 1; iTr < trLen; iTr++) { // skip header
    const tr = trs[iTr];
    const tds = tr.children;
    // 0 seed
    othr(tds[1]); // 1 firrtl
    lint(tds[2]); // 2 firrtl lint
    othr(tds[3]); // 3 mlir
    lint(tds[4]); // 4 mlir lint
    othr(tds[5]); // 5 yosys
    othr(tds[6]); // 6 yosys undef
    othr(tds[7]); // 7 yosys sat
    othr(tds[8]); // 8 yosys sat max
  }
};

window.onload = main;

/* eslint-env browser */
