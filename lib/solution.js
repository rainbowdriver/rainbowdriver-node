require('shelljs/global');
var path = require('path');

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
    getPackagePS: function(sln) {
        var files = find(sln.mainProjFolder + '\\AppPackages').filter(function(file) {
            return file.match(/.*\.ps1$/);
        });
        return files[0];
    },
    getSolution: function(folder) {
        cd(folder);
        var sln = util.findFirst('*.sln'),
            projectLine = grep(/Project\(/, sln),
            parts = projectLine.split('"');

        return {
            folder: pwd(),
            path: path.resolve(sln),
            slnId: parts[1],
            projName: parts[3],
            mainProj: path.resolve(parts[5]),
            mainProjFolder: path.resolve(parts[5].replace(/\\.*/, '')),
            projId: parts[7]
        };

    }
};

var script = '<script src="/rainbowdriver.js"></script>',
    include = '<Content Include="rainbowdriver.js" />',
    host = '<script type="text/javascript">rainbowDriver.host = \'ws://localhost:8080\';</script>';

exports.deinstrument = function (sln, callback) {
    var html = sln.mainProjFolder + '\\default.html';
    rm(sln.mainProjFolder + '\\rainbowdriver.js');
    console.log('rainbowdriver.js removed');
    sed('-i', new RegExp(script.replace(/\./g, '\\.').replace(/\//, '\/')), '', html);
    sed('-i', new RegExp(host.replace(/\./g, '\\.').replace(/\//, '\/')), '', html);
    echo('default.html deinstrumented');
    sed('-i', new RegExp(include.replace(/\./g, '\\.').replace(/\//, '\/')), '', sln.mainProj);
    echo('jsproj deinstrumented');
    callback();
};

exports.instrument = function(sln, callback) {
    var jsproj = sln.mainProj,
        projFolder = sln.mainProjFolder,
        html = projFolder + '\\default.html';


    if(!grep(include, jsproj)) {
        sed('-i', /<\/AppxManifest>/, '</AppxManifest>' + include, jsproj);
    }
    echo('jsproj instrumented');

    if(!grep(script + host, html)) {
        sed('-i', /<\/title>/, '</title>' + script + host, html);
    }
    echo('default.html instrumented');

    cd(__dirname + '/../node_modules/rainbowdriver-client/src/');
    cat(ls('*.js')).to(sln.mainProjFolder + '\\rainbowdriver.js');
    console.log('rainbowdriver.js in place');

    callback();
};

exports.util = util;

