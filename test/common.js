'use strict';

// taken from https://github.com/nodejs/node/blob/master/test/common/index.js

exports.crashOnUnhandledRejection = function () {
  process.on('unhandledRejection',
    function (err) { process.nextTick(function () { throw err; }); });
};

exports.mustCall = function (fn, exact) {
  return _mustCallInner(fn, exact, 'exact');
};

function noop () { }

var mustCallChecks = [];

function runCallChecks (exitCode) {
  if (exitCode !== 0) return;

  var failed = mustCallChecks.filter(function (context) {
    if ('minimum' in context) {
      context.messageSegment = 'at least ' + context.minimum;
      return context.actual < context.minimum;
    } else {
      context.messageSegment = 'exactly ' + context.exact;
      return context.actual !== context.exact;
    }
  });

  failed.forEach(function (context) {
    console.log('Mismatched %s function calls. Expected %s, actual %d.',
      context.name,
      context.messageSegment,
      context.actual);
    console.log(context.stack.split('\n').slice(2).join('\n'));
  });

  if (failed.length) process.exit(1);
}

function _mustCallInner (fn, criteria, field) {
  criteria = criteria !== undefined ? criteria : 1;
  if (process._exiting) {
    throw new Error('Cannot use common.mustCall*() in process exit handler');
  }
  if (typeof fn === 'number') {
    criteria = fn;
    fn = noop;
  } else if (fn === undefined) {
    fn = noop;
  }

  if (typeof criteria !== 'number') {
    throw new TypeError('Invalid ' + field + ' value: ' + criteria);
  }

  var context = {
    actual: 0,
    stack: (new Error()).stack,
    name: fn.name || '<anonymous>'
  };
  context[field] = criteria;

  // add the exit listener only once to avoid listener leak warnings
  if (mustCallChecks.length === 0) process.on('exit', runCallChecks);

  mustCallChecks.push(context);

  return function () {
    context.actual++;
    return fn.apply(this, arguments);
  };
}

Object.defineProperty(exports, 'hasCrypto', {
  get: function () {
    return Boolean(process.versions.openssl);
  }
});

exports.printSkipMessage = function (msg) {
  console.log('1..0 # Skipped: ' + msg);
};

exports.skip = function (msg) {
  exports.printSkipMessage(msg);
  process.exit(0);
};
