var fs = require('fs');
var zlib = require('zlib');

// var pipeline = require('stream.pipeline-shim');
var pipeline = require('..');

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

pipeline(fs.createReadStream(__filename), zlib.createGzip(), fs.createWriteStream(__filename + '.gz'), function(err) {
  if (err) {
    console.error('Pipeline failed.', err);
  } else {
    console.log('Pipeline succeeded.');
  }
});
