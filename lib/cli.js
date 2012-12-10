var spawn    = require("child_process").spawn;
var optimist = require('optimist');
var solution = require('./solution');
var builder  = require('./builder');
var path     = require('path');
var server;

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
    startingFolder = process.cwd(), folder,
    cli = optimist
        .usage('Usage: rainbowdriver [task1]..[taskN] [folder] \n\n\tpossible tasks: ' + defaultQueue.join(', '))
        .boolean('b')
        .default('b', true)
        .alias('b', 'bail').describe('b', 'Stop on frist error')
        .boolean('l')
        .default('l', false)
        .alias('l', 'local').describe('l', 'run local server in background')
        .string('r')
        .alias('r', 'run').describe('r', 'run this command after all tasks')
        .check(function(cli) {
            folder = (cli._ || []).filter(function(arg) {
                return !(arg in builder) && !(arg in defaultQueue);
            });
            folder = path.resolve(folder[0]);
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


function end(code) {
    process.exit(code);
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
    } else {
        if(cli.run) {
            console.log(cli.run);
            var runner = spawn('powershell.exe', [cli.run], { cwd: startingFolder, env: process.env });
            runner.stdout.pipe(process.stdout, { end: false });
            runner.stderr.pipe(process.stderr, { end: false });
            runner.on('exit', end);
            runner.on('error', end);
        }
    }
}

exports.run = function() {
    if(cli.local && !server) {
        server = spawn('node', [__dirname + '/../node_modules/rainbowdriver-server/server.js']);
        server.stdout.pipe(process.stdout, { end: false });
        server.stderr.pipe(process.stderr, { end: false });
    }
    next();
};

 process.on('exit', function (code) {
    if(server) {
        server.kill();
    }
 });
