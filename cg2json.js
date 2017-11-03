'use strict';

module.exports = function(graphText) {
  const DATA = getBaseObject();
  const graph = graphText;

  // metadata
  const metadataEnd = graph.indexOf('----');
  const metadata = graph.slice(0, metadataEnd).split('\n');
  metadata.forEach(function(m) {
    if (m.length) {
      let keyEnd = m.indexOf(':');
      let key, value;

      if (keyEnd === -1) {
        DATA.metadata.notes.push(m);
      } else {
        key = m.slice(0, keyEnd);
        value = removeWhiteSpace(m.slice(keyEnd+1, m.length));
        DATA.metadata[key] = value;
      }
    }
  });

  // call thread
  const cgBegin = graph.indexOf('Call graph:');
  const cgEnd = graph.indexOf('Total number in stack');
  const cg = graph.slice(cgBegin, cgEnd).split('\n');

  let currentThread = null;
  for (let l = 0; l < cg.length; l++) {
    let line = cg[l];
    if (!line.length || line === 'Call graph:') continue; // zero length line
    line = removeWhiteSpace(line);

    // this is a thread header
    if (line[0] !== '+' && line.indexOf('Thread_') > -1) {
      DATA.threads[line] = [];
      currentThread = DATA.threads[line];
      continue;
    }

    // currentThread.push(line);
  }

  // counts
  const countsBegin = graph.indexOf('Total number in stack');
  const countsEnd = graph.indexOf('Sort by top of stack');
  const counts = graph.slice(countsBegin, countsEnd).split('\n');
  for (let c = 0; c < counts.length; c++) {
    let line = counts[c];
    if (!line.length || line.indexOf('Total number in stack') > -1) continue;
    line = removeWhiteSpace(line);

    let count = getPrefixCount(line);
    DATA.counts.total+=count;

    let countObj = {
      count: count,
      process: removeWhiteSpace(line.slice((count + '').length+1, line.length))
    };

    DATA.counts.instances.push(countObj);
  }
  // count percentages
  for (let c = 0; c < DATA.counts.instances.length; c++) {
    let percent = Math.round(((DATA.counts.instances[c].count / DATA.counts.total) * 100) * 1000 ) / 1000;
    DATA.counts.instances[c].percent = percent;
  }

  return DATA;
}

function getBaseObject() {
  return {
    metadata: {
      notes: []
    },
    threads: {},
    counts: {
      total: 0,
      instances: []
    }
  };
}

function removeWhiteSpace(string) {
  let newString = '';
  for (var i = 0; i < string.length; i++) {
    if (newString.length > 0) {
      newString+=string[i];
      continue;
    }

    if (string[i] === ' ') {
      continue;
    } else {
      newString+=string[i];
    }
  }
  return newString;
}


function getPrefixCount(string) {
  var numString = '';
  for (let i = 0; i < string.length; i++) {
    if (parseInt(string[i]) !== NaN) numString+=string[i];
    if (string[i] === ' ') break;
  }
  return parseInt(numString);
}
