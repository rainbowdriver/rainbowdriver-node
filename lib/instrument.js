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
    },
    getSolution: function() {
        // Project("{262852C6-CD72-467D-83FE-5EEB1973A190}") = "rainbowdriver-example", "rainbowdriver-example\rainbowdriver-example.jsproj", "{67774EDD-02C6-453A-89DD-E7B8EE2E794F}"
        var sln = util.findFirst('*.sln'),
            projectLine = grep(/Project\(/, sln),
            parts = projectLine.split('"');

        return {
            slnId: parts[1],
            projName: parts[3],
            mainProj: parts[5],
            projId: parts[7]
        };

    }
};

exports.instrument = function(folder) {
    cd(folder);

    var sln = util.getSolution(),
        jsproj = sln.mainProj,
        html = sln.mainProj.replace(/\\.*/, '') + '\\default.html',
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
    return sln;
};

exports.util = util;

