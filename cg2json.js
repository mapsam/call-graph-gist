'use strict';

var md = require('markdown-it')({ html: true });
var shortid = require('shortid');

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
        value = removeLeadingWhiteSpace(m.slice(keyEnd+1, m.length));
        DATA.metadata[key] = value;
      }
    }
  });

  // call thread
  const cgBegin = graph.indexOf('Call graph:');
  const cgEnd = graph.indexOf('Total number in stack');
  const cg = graph.slice(cgBegin, cgEnd).split('\n');

  let currentThread = null;
  let currentThreadIndex = 0;
  for (let l = 0; l < cg.length; l++) {
    let line = cg[l];
    if (!line.length || line === 'Call graph:') continue; // zero length line
    // line = removeLeadingWhiteSpace(line);

    // this is a thread header
    if (line[0] !== '+' && line.indexOf('Thread_') > -1) {
      DATA.threads.push({
        name: line,
        count: getThreadCount(line),
        markdown: '',
        html: ''
      });
      currentThread = DATA.threads[currentThreadIndex];
      currentThreadIndex++;
    } else {
      line = convertToMarkdownListItem(line);
      currentThread.markdown += line;
    }
  }

  // convert each thread markdown into HTML
  for (let m = 0; m < DATA.threads.length; m++) {
    DATA.threads[m].html = md.render(DATA.threads[m].markdown);
    DATA.threads
    delete DATA.threads[m].markdown;
  }

  // counts
  const countsBegin = graph.indexOf('Total number in stack');
  const countsEnd = graph.indexOf('Sort by top of stack');
  const counts = graph.slice(countsBegin, countsEnd).split('\n');
  for (let c = 0; c < counts.length; c++) {
    let line = counts[c];
    if (!line.length || line.indexOf('Total number in stack') > -1) continue;
    line = removeLeadingWhiteSpace(line);

    let count = getPrefixCount(line);
    DATA.counts.total+=count;

    let countObj = {
      count: count,
      process: removeLeadingWhiteSpace(line.slice((count + '').length+1, line.length))
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
    threads: [],
    counts: {
      total: 0,
      instances: []
    }
  };
}

function removeLeadingWhiteSpace(string) {
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

function removeAllWhiteSpace(string) {
  return string.replace(' ', '');
}

function markdownListItemOfLength(len) {
  // len = len+2;
  return Array(len-4).join(' ') + '*' + ' ';
}

function getPrefixCount(string) {
  let numString = '';
  for (let i = 0; i < string.length; i++) {
    if (parseInt(string[i]) !== NaN) numString+=string[i];
    if (string[i] === ' ') break;
  }
  return parseInt(numString);
}

function lengthToFirstInteger(string) {
  let index = 0;
  for (let i = 0; i < string.length; i++) {
    if (parseInt(string[i])) {
      index = i;
      break;
    }
  }
  return index;
}
// xxxxxx

function convertToMarkdownListItem(string) {
  let lengthOfPrefix = lengthToFirstInteger(string);
  let prefix = markdownListItemOfLength(lengthOfPrefix);
  let content = string.slice(lengthOfPrefix);
  let id = shortid.generate();
  return prefix + '[&#128279;](#line-'+id+') <span class="thread-line" id="line-'+id+'">' + content + '</span>\n';
}

function getThreadCount(string) {
  let finalInt = '';
  for (let i = 0; i < string.length; i++) {
    if (parseInt(string[i])) {
      finalInt+=string[i];
    } else {
      break;
    }
  }
  return parseInt(finalInt);
}
