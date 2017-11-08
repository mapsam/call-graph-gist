'use strict';

const fs = require('fs');
const test = require('tape');
const cg2json = require('../cg2json');

const sampleGraphText = fs.readFileSync(__dirname + '/sample-graph.txt', 'utf8');

test('does it work?', assert => {
  const cg = cg2json(sampleGraphText);
  assert.end();
});
