var fs = require('fs');
var zlib = require('zlib');

// var pipeline = require('stream.pipeline-shim');
var pipeline = require('..');

var promisify = require('util.promisify');
var pipelinePromise = promisify(pipeline);

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

pipelinePromise(fs.createReadStream(__filename), zlib.createGzip(), fs.createWriteStream(__filename + '.gz'))
  .then(function() {
    console.log('Pipeline succeeded.');
  })
  .catch(console.error);
