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
    getPackagePS: function(sln) {
        var files = find(sln.mainProjFolder + '\\AppPackages').filter(function(file) {
            return file.match(/.*\.ps1$/);
        });
        return files[0];
    },
    getSolution: function(folder) {
        var sln = util.findFirst(folder + '/*.sln'),
            projectLine = grep(/Project\(/, sln),
            parts = projectLine.split('"');

        return {
            folder: pwd() + '\\' + folder,
            path: pwd() + '\\' + sln,
            slnId: parts[1],
            projName: parts[3],
            mainProj: parts[5],
            mainProjFolder: pwd() + '\\' + folder + parts[5].replace(/\\.*/, ''),
            projId: parts[7]
        };

    }
};

exports.instrument = function(sln) {
    cd(sln.folder);
    var jsproj = sln.mainProj,
        projFolder = sln.mainProjFolder,
        html = projFolder + '\\default.html',
        script = '<script src="/rainbowdriver.js"></script>',
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
    if (!test('-f', projFolder + '\\rainbowdriver.js')) {
        cp(__dirname + '\\..\\vendor\\rainbowdriver-client.js', projFolder + '\\rainbowdriver.js');
    }
    console.log('rainbowdriver client in place');
    return sln;
};

exports.util = util;

