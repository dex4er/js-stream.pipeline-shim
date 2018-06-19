'use strict';

// taken from https://github.com/nodejs/node/blob/master/test/parallel/test-stream-pipeline.js

var pipeline = require('..');

var common = require('./common');

if (!common.hasCrypto) {
  common.skip('missing crypto');
}

var assert = require('assert');
var http = require('http');
var stream = require('stream');
var util = require('util');

try {
  var promisify = require('util.promisify');
} catch (e) {}

common.crashOnUnhandledRejection();

(function () {
  var finished = false;
  var processed = [];
  var expected = [
    (typeof Buffer.alloc === 'function' ? Buffer.from('a') : new Buffer('a')),
    (typeof Buffer.alloc === 'function' ? Buffer.from('b') : new Buffer('b')),
    (typeof Buffer.alloc === 'function' ? Buffer.from('c') : new Buffer('c'))
  ];

  function MyReadable () {
    stream.Readable.call(this);
  }
  util.inherits(MyReadable, stream.Readable);
  MyReadable.prototype._read = function () { };

  var read = new MyReadable();

  function MyWritable () {
    stream.Writable.call(this);
  }
  MyWritable.prototype._write = function (data, enc, cb) {
    processed.push(data);
    cb();
  };
  util.inherits(MyWritable, stream.Writable);

  var write = new MyWritable();

  write.on('finish', function () {
    finished = true;
  });

  for (var i = 0; i < expected.length; i++) {
    read.push(expected[i]);
  }
  read.push(null);

  pipeline(read, write, common.mustCall(function (err) {
    assert.ok(!err, 'no error');
    assert.ok(finished);
    assert.deepEqual(processed, expected);
  }));
})();

(function () {
  function MyReadable () {
    stream.Readable.call(this);
  }
  MyReadable.prototype._read = function () { };
  util.inherits(MyReadable, stream.Readable);

  var read = new MyReadable();

  assert.throws(function () {
    pipeline(read, function () {});
  }, /ERR_MISSING_ARGS/);
  assert.throws(function () {
    pipeline(function () {});
  }, /ERR_MISSING_ARGS/);
  assert.throws(function () {
    pipeline();
  }, /ERR_MISSING_ARGS/);
})();

(function () {
  function MyReadable () {
    stream.Readable.call(this);
  }
  MyReadable.prototype._read = function () { };
  util.inherits(MyReadable, stream.Readable);

  var read = new MyReadable();

  function MyTransform () {
    stream.Transform.call(this);
  }
  MyTransform.prototype._transform = function (data, enc, cb) {
    cb(new Error('kaboom'));
  };
  util.inherits(MyTransform, stream.Transform);

  var transform = new MyTransform();

  function MyWritable () {
    stream.Writable.call(this);
  }
  MyWritable.prototype._write = function (data, enc, cb) {
    cb();
  };
  util.inherits(MyWritable, stream.Writable);

  var write = new MyWritable();

  var dst = pipeline(read, transform, write, common.mustCall(function (err) {
    assert.deepEqual(err, new Error('kaboom'));
  }));

  assert.strictEqual(dst, write);

  read.push('hello');
})();

(function () {
  var server = http.createServer(function (req, res) {
    function MyReadable () {
      stream.Readable.call(this);
    }
    MyReadable.prototype._read = function () {
      rs.push('hello');
      rs.push(null);
    };
    util.inherits(MyReadable, stream.Readable);

    var rs = new MyReadable();

    pipeline(rs, res, () => {});
  });

  server.listen(0, function () {
    var req = http.request({
      port: server.address().port
    });

    req.end();
    req.on('response', function (res) {
      var buf = [];
      res.on('data', function (data) { buf.push(data); });
      res.on('end', common.mustCall(function () {
        assert.deepEqual(
          Buffer.concat(buf),
          typeof Buffer.alloc === 'function' ? Buffer.from('hello') : new Buffer('hello')
        );
        server.close();
      }));
    });
  });
})();

(function () {
  var server = http.createServer(function (req, res) {
    function MyReadable () {
      stream.Readable.call(this);
    }
    MyReadable.prototype._read = function () {
      rs.push('hello');
    };
    util.inherits(MyReadable, stream.Readable);

    var rs = new MyReadable();

    pipeline(rs, res, () => {});
  });

  server.listen(0, function () {
    var req = http.request({
      port: server.address().port
    });

    req.end();
    req.on('response', function (res) {
      setImmediate(function () {
        res.destroy();
        server.close();
      });
    });
  });
})();

(function () {
  var server = http.createServer(function (req, res) {
    function MyReadable () {
      stream.Readable.call(this);
    }
    MyReadable.prototype._read = function () {
      rs.push('hello');
    };
    util.inherits(MyReadable, stream.Readable);

    var rs = new MyReadable();

    pipeline(rs, res, () => {});
  });

  var cnt = 10;

  function MyWritable () {
    stream.Writable.call(this);
  }
  MyWritable.prototype._write = function (data, enc, cb) {
    cnt--;
    if (cnt === 0) cb(new Error('kaboom'));
    else cb();
  };
  util.inherits(MyWritable, stream.Writable);

  var badSink = new MyWritable();

  server.listen(0, function () {
    var req = http.request({
      port: server.address().port
    });

    req.end();
    req.on('response', function (res) {
      pipeline(res, badSink, common.mustCall(function (err) {
        assert.deepEqual(err, new Error('kaboom'));
        server.close();
      }));
    });
  });
})();

(function () {
  var server = http.createServer(function (req, res) {
    pipeline(req, res, common.mustCall());
  });

  server.listen(0, function () {
    var req = http.request({
      port: server.address().port
    });

    function MyReadable () {
      stream.Readable.call(this);
    }
    MyReadable.prototype._read = function () {
      rs.push('hello');
    };
    util.inherits(MyReadable, stream.Readable);

    var rs = new MyReadable();

    pipeline(rs, req, common.mustCall(function () {
      server.close();
    }));

    req.on('response', function (res) {
      var cnt = 10;
      res.on('data', function () {
        cnt--;
        if (cnt === 0) rs.destroy();
      });
    });
  });
})();

(function () {
  var makeTransform = function () {
    function MyTransform () {
      stream.Transform.call(this);
    }
    MyTransform.prototype._transform = function (data, enc, cb) {
      cb(null, data);
    };
    util.inherits(MyTransform, stream.Transform);

    var tr = new MyTransform();

    return tr;
  };

  function MyReadable () {
    stream.Readable.call(this);
  }
  MyReadable.prototype._read = function () {
    rs.push('hello');
  };
  util.inherits(MyReadable, stream.Readable);

  var rs = new MyReadable();

  var cnt = 10;

  function MyWritable () {
    stream.Writable.call(this);
  }
  MyWritable.prototype._write = function (data, enc, cb) {
    cnt--;
    if (cnt === 0) return cb(new Error('kaboom'));
    cb();
  };
  util.inherits(MyWritable, stream.Writable);

  var ws = new MyWritable();

  pipeline(
    rs,
    makeTransform(),
    makeTransform(),
    makeTransform(),
    makeTransform(),
    makeTransform(),
    makeTransform(),
    ws,
    common.mustCall(function (err) {
      assert.deepEqual(err, new Error('kaboom'));
    })
  );
})();

(function () {
  if (!promisify) return;

  var pipelinePromise = promisify(pipeline);

  function run () {
    function MyReadable () {
      stream.Readable.call(this);
    }
    MyReadable.prototype._read = function () {};
    util.inherits(MyReadable, stream.Readable);

    var read = new MyReadable();

    function MyWritable () {
      stream.Writable.call(this);
    }
    MyWritable.prototype._write = function (data, enc, cb) {
      cb();
    };
    util.inherits(MyWritable, stream.Writable);

    var write = new MyWritable();

    read.push('data');
    read.push(null);

    var finished = false;

    write.on('finish', function () {
      finished = true;
    });

    return pipelinePromise(read, write)
      .then(function () {
        assert(finished);
      });
  }

  run();
})();

(function () {
  function MyReadable () {
    stream.Readable.call(this);
  }
  util.inherits(MyReadable, stream.Readable);
  MyReadable.prototype._read = function () { };

  var read = new MyReadable();

  function MyTransform () {
    stream.Transform.call(this);
  }
  MyTransform.prototype._transform = function (data, enc, cb) {
    cb(new Error('kaboom'));
  };
  util.inherits(MyTransform, stream.Transform);

  var transform = new MyTransform();

  function MyWritable () {
    stream.Writable.call(this);
  }
  MyWritable.prototype._write = function (data, enc, cb) {
    cb();
  };
  util.inherits(MyWritable, stream.Writable);

  var write = new MyWritable();

  read.on('close', common.mustCall());
  transform.on('close', common.mustCall());
  write.on('close', common.mustCall());

  process.on('uncaughtException', common.mustCall((err) => {
    assert.deepEqual(err, new Error('kaboom'));
  }));

  const dst = pipeline(read, transform, write);

  assert.equal(dst, write);

  read.push('hello');
})();
