import * as fs from 'fs';
import * as util from 'util';
import * as zlib from 'zlib';

// import pipeline = require('stream.pipeline-shim');
import pipeline = require('..');

// Have to wait for https://github.com/DefinitelyTyped/DefinitelyTyped/pull/35270
// tslint:disable-next-line:no-var-requires
const promisify = require('util.promisify') as typeof util.promisify;
const pipelinePromise = promisify(pipeline);

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

async function run() {
  await pipelinePromise(fs.createReadStream(__filename), zlib.createGzip(), fs.createWriteStream(__filename + '.gz'));
  console.log('Pipeline succeeded.');
}

run().catch(console.error);
