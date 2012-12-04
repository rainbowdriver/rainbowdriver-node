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

var defaultQueue = ['instrument', 'remove', 'clean', 'build', 'install', 'launch'],
    folder,
    cli = optimist
        .usage('Usage: rainbowdriver [action1]..[actionN] [folder] \n\n\tpossible actions: ' + defaultQueue)
        .boolean('b')
        .default('b', true)
        .alias('b', 'bail').describe('b', 'Stop on frist error')
        .check(function(cli) {
            folder = (cli._ || []).filter(function(arg) {
                return !(arg in builder);
            })[0];
            if(!folder) {
                throw "Please, provide the project folder";
            }
        })
        .argv;


var sln =solution.util.getSolution(folder);

var queue = (cli._ || []).filter(function(arg) {
    return arg === 'instrument' || (arg in builder);
});

if(!queue.length) {
    queue = defaultQueue;
}


function next(err, data) {
    log(err, data);
    var nextCall = queue.shift();
    if(err && cli.bail) {
        return;
    }
    if(nextCall) {
        if(nextCall === 'instrument') {
            solution.instrument(sln);
            next();
        } else {
            builder[nextCall](sln, next);
        }
    }
}

exports.run = next;
