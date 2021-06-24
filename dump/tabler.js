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

  if ([
    {h: '$dff',   c: 'timeout', m: 'dff\\) to SAT database.'},
    {h: 'Dump',  c: 'timeout', m: /crash backtrace/},
    {h: 'Crash',  c: 'timeout', m: /Exception in thread "main"/},
    {h: 'tOut',   c: 'timeout', m: /timeout/},
    {h: 'syntax', c: 'error',   m: /ERROR: syntax error/},
    {h: 'fail',   c: 'fail',    m: /proof did fail/},
    {h: m => 'UNP ' + m[1], c: 'unproven', m: /ERROR: Found (\d+) unproven/},
    {h: () => 'err', c: 'error', m: /ERROR: /},
    {h: () => 'warn', c: 'warning', m: /Warning: /}
  ].some(e => {
    const m = txt.match(e.m);
    if (m) {
      root.innerHTML = (typeof e.h === 'function') ? e.h(m) : e.h;
      root.classList.add(e.c);
      return true;
    }
  })) {
    return;
  }
  root.innerHTML = 'err';
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
