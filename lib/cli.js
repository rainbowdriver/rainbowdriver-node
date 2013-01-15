var spawn    = require("child_process").spawn;
var optimist = require('optimist');
var solution = require('./solution');
var builder  = require('./builder');
var path     = require('path');

var server, runner;

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

var task,
    solutionMethods = [],
    builderMethods = [];

for (task in solution) {
    if(solution.hasOwnProperty(task) && solution[task] instanceof Function) {
        solutionMethods.push(task);
    }
}

for (task in builder) {
    if(builder.hasOwnProperty(task) && builder[task] instanceof Function) {
        builderMethods.push(task);
    }
}

var folders, folder,
    defaultQueue = ['clean', 'instrument', 'build', 'deinstrument', 'remove', 'install', 'launch'],
    startingFolder = process.cwd(),
    cli = optimist
        .usage('Usage: rainbowdriver [task1]..[taskN] [folder] \n\n\tpossible tasks: ' + solutionMethods.concat(builderMethods).join(', '))

        .boolean('h')
        .default('h', false)
        .alias('h', 'help').describe('h', 'This help screen')

        .boolean('b')
        .default('b', false)
        .alias('b', 'bail').describe('b', 'Stop on frist error')

        .boolean('l')
        .default('l', false)
        .alias('l', 'local').describe('l', 'run local server in background')

        .string('r')
        .alias('r', 'run').describe('r', 'run this command after all tasks (implies -l)')
        .check(function(cli) {
            if(cli.run) {
                cli.local = true;
            }
        })

        .string('f')
        .alias('f', 'runfolder').describe('f', 'starting folder for test runner')
        .check(function(cli) {
            if(cli.runfolder) {
                cli.runfolder = path.resolve(cli.runfolder);
            }
        })

        .check(function(cli) {
            folders = (cli._ || []).filter(function(arg) {
                return !(arg in builder) && !(arg in solution) && !!path.resolve(arg);
            });
            folder = path.resolve( folders.length ? folders[0] : startingFolder );
        })
        .argv;

if(cli.help) {
    console.log(optimist.help());
    exit();
}

var sln = solution.util.getSolution(folder);

var queue = (cli._ || []).filter(function(arg) {
    return ((arg in solution) || (arg in builder));
});

if(!queue.length && (!cli.local || cli.run)) {
    queue = defaultQueue;
}

function end(code) {
    if(cli.run && cli.launch && cli.install && cli.instrument) {
        console.log('Railbowdriver removing instrumented build');
        builder.remove(sln, function() {
            process.exit();
        });
    } else {
        process.exit(code);
    }
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
        if(cli.local && !server) {
            server = spawn('node', [__dirname + '/../node_modules/rainbowdriver-server/server.js']);
            server.stdout.pipe(process.stdout, { end: false });
            server.stderr.pipe(process.stderr, { end: false });
        }
        if(cli.run) {
            console.log(cli.run);
            runner = spawn('powershell.exe', [cli.run], { cwd: cli.runfolder || startingFolder, env: process.env });
            runner.stdout.pipe(process.stdout, { end: false });
            runner.stderr.pipe(process.stderr, { end: false });
            runner.on('exit', end);
            runner.on('error', end);
        }
    }
}

exports.run = function() {
    if( queue.length ) {
        console.log('Running: ' + queue.join(', '));
    }
    next();
};

 process.on('exit', function (code) {
    if(server) {
        server.kill();
    }
    if(runner) {
        runner.kill();
    }
 });
