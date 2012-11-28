
var instrument = require('./instrument').instrument;
var builder = require('./builder');

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


function run(args) {
    args = args.slice(2);
    if(!args.length) { die('Please provide a folder that contains the jsproj file.'); }
    var sln = instrument(args[0]);

    // builder.getInstalled(function(err, installedApps) {
    //     installedApps.forEach(function(appId) {
    //         if(~appId.indexOf(sln.projId) || ~appId.indexOf(sln.projName)) {
    //             console.log('Found ' + appId + '\n');
    //         }
    //     });
    // });

    builder.removeApp(sln.projName, function(err, data) {
        log(err, data);
        builder.clean(sln.path,function(err, data) {
            log(err, data);
            builder.build(sln.path, function(err, data) {
                log(err, data);
                builder.install(sln.path, function(err, data) {
                    log(err, data);
                });
            });
        });
    });

}

exports.run = run;

