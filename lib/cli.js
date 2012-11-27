
var instrument = require('./instrument').instrument;
require('shelljs/global');

function die(message) {
    console.log(message);
    process.exit(1);
}

var util = {
    findFirst: function(search) {
        var files = ls(search);
        if(!files.length) { die('File "'+search+'" not found.'); }
        return files[0];
    }
};

function run(args) {
    args = args.slice(2);
    if(!args.length) { die('Please provide a folder that contains the jsproj file.'); }

    cd(args[0]);

    var jsproj = util.findFirst('*.jsproj'),
        html = util.findFirst('default.html'),
        script = '<script src="//rainbowdriver.js"></script>',
        include = '<Content Include="rainbowdriver.js" />',
        host = '<script type="text/javascript">rainbowDriver.host = \'ws://localhost:8080\';</script>';

    if(!grep(include, jsproj)) {
        sed('-i', /<\/AppxManifest>/, '</AppxManifest>\n' + include, jsproj);
    }
    echo('jsproj instrumented');

    if(!grep(script + host, html)) {
        sed('-i', /<\/title>/, '</title>\n' + script + host, html);
    }
    echo('default.html instrumented');
}

exports.run = run;
exports.util = util;

