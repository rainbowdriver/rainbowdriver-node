require('shelljs/global');
var path = require('path');

function die(message) {
    console.log(message);
    process.exit(1);
}

var util = {
    findFirst: function(search, folder) {
        cd(folder);
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
        var slnPath = path.resolve(sln),
            sln = util.findFirst('*.sln', slnPath),
            projectLine = grep(/Project\(/, sln).replace(/\n.*/m,''),
            parts = projectLine.split('"'),

            mainProj = path.resolve(parts[5]),
            mainProjFolder = path.resolve(parts[5].replace(/\\.*/, '')),
            pkg = util.findFirst('*.appxmanifest', mainProjFolder),
            entryLines = grep(/<[^>]+StartPage="[^"]+.html"[^>]*>/, pkg).split(/\n/),
            windows = [];

        entryLines.forEach(function(line) {
            var type = line.replace(/.*(Id|Category).*/, '$1');
            if(type.trim()) {
                windows.push({
                    type: type,
                    name: line.replace(/.*(Id|Category)="([^"]+)".*/, '$2'),
                    file: path.resolve(mainProjFolder + "\\" + line.replace(/.*StartPage="([^"]+.html)".*/, '$1'))
                });
            }
        });

        var solution = {
            folder: pwd(),
            path: slnPath,
            slnId: parts[1],
            projName: parts[3],
            mainProjFolder: mainProjFolder,
            mainProj: mainProj,
            projId: parts[7],
            windows: windows
        };

        return solution;
    }
};

var script = '<script src="/rainbowdriver.js"></script>',
    include = '<Content Include="rainbowdriver.js" />',
    host = '<script type="text/javascript">rainbowDriver.host = \'ws://localhost:8080\';</script>';

function getWinString(win) {
    return "\n" + script + "\n" + host + "\n" + '<script type="text/javascript">rainbowDriver.windowName = "'+win.name+'";</script>' + "\n";
}

exports.deinstrument = function (sln, callback) {
    rm(sln.mainProjFolder + '\\rainbowdriver.js');
    console.log('rainbowdriver.js removed');

    sln.windows.forEach(function (win) {
        var str = getWinString(win);
        sed('-i', new RegExp(str.replace(/\./g, '\\.')), '', win.file);
        echo(win.file + ' deinstrumented');
    });

    sed('-i', new RegExp(include.replace(/\./g, '\\.').replace(/\//, '\/')), '', sln.mainProj);
    echo('jsproj deinstrumented');
    callback();
};

exports.instrument = function(sln, callback) {
    var jsproj = sln.mainProj,
        projFolder = sln.mainProjFolder;

    if(!grep(include, jsproj)) {
        sed('-i', /<\/AppxManifest>/, '</AppxManifest>' + include, jsproj);
    }
    echo('jsproj instrumented');

    sln.windows.forEach(function (win) {
        var str = getWinString(win);
        if(!grep(str, win.file)) {
            sed('-i', /<\/title>/, '</title>' + str, win.file);
        }
        echo( win.file + ' instrumented');
    });

    cd(__dirname + '/../node_modules/rainbowdriver-client/src/');
    cat(ls('*.js')).to(sln.mainProjFolder + '\\rainbowdriver.js');
    console.log('rainbowdriver.js in place');

    callback();
};

exports.util = util;

