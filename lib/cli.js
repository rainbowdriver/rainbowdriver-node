var optimist = require('optimist');
var solution = require('./solution');
var builder  = require('./builder');

function die(message) {
    console.log(message);
    process.exit(1);
}

function log(err, data) {
    if (err && err.length) {
        console.log(err.join(''));
    }
    if(data && data.length) {
        console.log(data.join(''));
    }
}

var cli = optimist
        .boolean('b')
        .default('b', true)
        .alias('b', 'bail').describe('b', 'Stop on frist error')
        .argv;

var sln;

var queue = (cli._ || []).filter(function(arg) {
    return (arg in builder);
});

if(!queue.length) {
    queue = ['remove', 'clean', 'build', 'install', 'launch'];
}

function next(err, data) {
    log(err, data);
    var nextCall = queue.shift();
    if(err && cli.bail) {
        return;
    }
    if(nextCall) {
        builder[nextCall](sln, next);
    }
}

function run() {

    var folder = (cli._ || []).filter(function(arg) {
        return !(arg in builder);
    })[0];

    sln = solution.instrument(folder);

    next();
}

exports.run = run;

