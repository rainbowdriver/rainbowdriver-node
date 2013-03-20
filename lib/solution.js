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

    getSolution: function(sln) {
        var slnFilename = path.basename(sln),
            slnPath = path.dirname(sln),
            projectLine = grep(/Project\(/, slnFilename).replace(/\n.*/m,''),
            parts = projectLine.split('"'),

            mainProj = path.resolve(parts[5]),
            mainProjFolder = path.resolve(parts[5].replace(/\\.*/, '')),
            pkg = util.findFirst('*.appxmanifest', mainProjFolder),
            entryLines = grep(/<[^>]+StartPage="[^"]+.html"[^>]*>/, pkg).split(/\n/),
            backgroundSupported = !!grep(/windows\.backgroundTasks/, pkg),
            windows = [];

        entryLines.forEach(function(line) {
            var type = line.replace(/<([^ ]+).*/, '$1');
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
            windows: windows,
            backgroundSupported: backgroundSupported
        };

        return solution;
    },

    getFirstSolution: function(folder) {
        var slnPath = path.resolve(folder);

        return util.getSolution(path.join(slnPath, util.findFirst('*.sln', slnPath)));
    }

};

var script = '<script src="/rainbowdriver.js"></script>',
    include = '<Content Include="rainbowdriver.js" />',
    buildID = +new Date();

function getWinString(sln, win) {
    var scripts = [script];
    var inline = [
        '<script type="text/javascript">',
        'rainbowDriver.id = "BUILD_ID";'.replace("BUILD_ID", (sln.projName + "_" + buildID)),
        'rainbowDriver.windowName = "WINDOW_NAME";'.replace("WINDOW_NAME", win.name),
        'rainbowDriver.windowLoc = "FILE";'.replace("FILE", win.file.replace(/\\/g, '\\\\')),
        'rainbowDriver.windowType = "TYPE";'.replace("TYPE", win.type.trim()),
        'rainbowDriver.host = "SERVER";'.replace("SERVER", sln.server),
        'rainbowDriver.backgroundSupported = BG_SUPORT;'.replace("BG_SUPORT", sln.backgroundSupported),
        '//rainbowdriver</script>'
    ];
    scripts = scripts.concat(inline);
    return '\n' + scripts.join('\n') + '\n';
}

exports.deinstrument = function (sln, callback) {
    rm(sln.mainProjFolder + '\\rainbowdriver.js');
    console.log('rainbowdriver.js removed');

    sln.windows.forEach(function (win) {
        sed('-i', new RegExp("</title>(.|\n)*//rainbowdriver</script>\n", "m"), '</title>', win.file);
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
        var str = getWinString(sln, win);
        if(!grep('//rainbowdriver</script>', win.file)) {
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

