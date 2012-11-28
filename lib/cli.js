
var instrument = require('./instrument').instrument;
var builder = require('./builder');

function die(message) {
    console.log(message);
    process.exit(1);
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
        console.log(data.join('\n'));
        builder.clean(sln.path,function(err, data) {
            console.log(err && err.length && err.join(''));
            console.log(data && data.length && data.join(''));

        });
    });

}

exports.run = run;

