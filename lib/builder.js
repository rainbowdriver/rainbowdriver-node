var spawn    = require("child_process").spawn,
    solution = require('./solution'),
    msBuild  = "c:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\MSBuild.exe";

function runChild(command, args, callback) {
    var child = spawn(command, args, {customFds:[0,1,2]}),
        data = [];

    child.on("exit",function(code, signal){
        if(callback) {
            callback(code);
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
    var args = [sln.mainProj, "/p:Configuration=Release", "/t:Build", "/m"];
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

exports.launch = function (sln, callback) {
    var args = [__dirname + '\\launch.ps1', "\"" + sln.projName + "\""];
    runChild("powershell.exe", args, callback);
};
