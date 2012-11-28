
var instrument = require('./instrument').instrument;

function die(message) {
    console.log(message);
    process.exit(1);
}


function run(args) {
    args = args.slice(2);
    if(!args.length) { die('Please provide a folder that contains the jsproj file.'); }
    var sln = instrument(args[0]);

    require('./builder').getInstalled(function(err, installedApps) {
        installedApps.forEach(function(appId) {
            if(~appId.indexOf(sln.projId) || ~appId.indexOf(sln.projName)) {
                console.log('Found ' + appId);
            }
        });
    });

}

exports.run = run;

