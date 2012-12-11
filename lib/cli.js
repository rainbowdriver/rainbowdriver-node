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

var defaultQueue = ['remove', 'clean', 'instrument', 'build', 'deinstrument', 'install', 'launch'],
    startingFolder = process.cwd(), folder,
    cli = optimist
        .usage('Usage: rainbowdriver [task1]..[taskN] [folder] \n\n\tpossible tasks: ' + defaultQueue.join(', '))
        .boolean('b')
        .default('b', true)
        .alias('b', 'bail').describe('b', 'Stop on frist error')
        .boolean('l')
        .default('l', true)
        .alias('l', 'local').describe('l', 'run local server in background')
        .string('r')
        .alias('r', 'run').describe('r', 'run this command after all tasks')
        .string('f')
        .alias('f', 'runfolder').describe('f', 'starting folder for test runner')
        .check(function(cli) {
            if(cli.runfolder) {
                cli.runfolder = path.resolve(cli.runfolder);
            }
        })
        .check(function(cli) {
            folder = (cli._ || []).filter(function(arg) {
                return !(arg in builder) && !(arg in solution);
            });
            folder = path.resolve(folder[0]);
            if(!folder) {
                folder = path.resolve(startingFolder);
            }
        })
        .argv;


var sln = solution.util.getSolution(folder);

var queue = (cli._ || []).filter(function(arg) {
    return ((arg in solution) || (arg in builder));
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
        console.log('\n\nTASK: ' + nextCall + '\n\n');
        if(nextCall in solution) {
            solution[nextCall](sln, next);
        } else if (nextCall in builder) {
            builder[nextCall](sln, next);
        }
    } else {
        if(cli.run) {
            console.log(cli.run);
            var runner = spawn('powershell.exe', [cli.run], { cwd: cli.runfolder || startingFolder, env: process.env });
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
    console.log('Running: ' + queue.join(', '));
    next();
};

 process.on('exit', function (code) {
    if(server) {
        server.kill();
    }
 });
