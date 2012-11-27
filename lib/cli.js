
var instrument = require('./instrument').instrument;

function die(message) {
    console.log(message);
    process.exit(1);
}

function run(args) {
    args = args.slice(2);
    if(!args.length) { die('Please provide a folder that contains the jsproj file.'); }
    instrument(args[0]);
}

exports.run = run;

