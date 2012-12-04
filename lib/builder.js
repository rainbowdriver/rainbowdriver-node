var spawn    = require("child_process").spawn,
    solution = require('./solution'),
    msBuild  = "c:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\MSBuild.exe";

function runChild(command, args, callback) {
    var results = [],
        errors = [],
        removeCmd = spawn(command, args);

    removeCmd.stdout.on("data", function(data) {
        var log = data.toString();
        results.push(log);
    });
    removeCmd.stderr.on("data",function(data){
        errors.push(data.toString());
    });
    removeCmd.on("exit",function(){
        if(callback) {
            callback(errors.length && errors || null, results);
        }
    });
}

exports.remove = function(sln, callback) {
    var args = ['Get-AppxPackage | where Name -eq ' + sln.projName + ' | Remove-AppxPackage'];
    runChild("powershell.exe", args, callback);
};

exports.clean = function(sln, callback) {
    var args = [sln.path, "/t:Clean", "/m"];
    runChild(msBuild, args, callback);
};

exports.build = function(sln, callback) {
    var args = [sln.path, "/p:Configuration=Release", "/t:Build", "/m"];
    runChild(msBuild, args, callback);
};

exports.install = function(sln, callback) {
    var ps1 = solution.util.getPackagePS(sln);
    if(ps1) {
        runChild("powershell.exe", [ps1, "-Force"], callback);
    } else {
        callback(null, null);
    }
};

function getInstalled(callback) {
    var appId = /[^ ]+[ ]+([^ ]+\![^ ]+)[^ ]*/,
        args = [__dirname + '\\..\\helper.ps1', 'get-list'];

    runChild("powershell.exe", args, function(err, data) {
        if(data && data.length) {
            data = data.filter(function(log) {
                return appId.test(log);
            }).map(function(log) {
                return log.match(appId)[1];
            });
        }
        callback(err, data);
    });
}

exports.launch = function (sln, callback) {
    getInstalled(function(err, installedApps) {
        installedApps.forEach(function(appId) {
            if(~appId.indexOf(sln.projId) || ~appId.indexOf(sln.projName)) {
                var args = [__dirname + '\\..\\helper.ps1', 'start-app', appId];
                runChild("powershell.exe", args, callback);
            }
        });
    });

};
