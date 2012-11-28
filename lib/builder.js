var spawn = require("child_process").spawn,
    msBuild = "c:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\MSBuild.exe";

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

exports.clean = function(sln, callback) {
    var args = [sln, "/t:Clean", "/m"];
    runChild(msBuild, args, callback);
};


exports.getInstalled = function(callback) {
    var appId = /[^ ]+[ ]+([^ ]+\![^ ]+)[^ ]*/,
        args = [__dirname + '\\..\\helper.ps1', 'get-list'];

    console.log('Finding appIds');
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
};

exports.removeApp = function(appName, callback) {
    var args = ['Get-AppxPackage | where Name -eq ' + appName + ' | Remove-AppxPackage'];

    console.log('Removing ' + appName);
    runChild("powershell.exe", args, callback);
};
