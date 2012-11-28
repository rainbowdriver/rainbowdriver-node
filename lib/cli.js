
var instrument = require('./instrument').instrument;

function die(message) {
    console.log(message);
    process.exit(1);
}

function run(args) {
    args = args.slice(2);
    if(!args.length) { die('Please provide a folder that contains the jsproj file.'); }
    instrument(args[0]);

    var spawn = require("child_process").spawn,child;
    child = spawn("powershell.exe",[__dirname + '\\..\\helper.ps1', 'get-list']);
    var buff = [];
    child.stdout.on("data",function(data){
        buff.push(data.toString());
    });
    child.stderr.on("data",function(data){
        buff.push(data.toString());
    });
    child.on("exit",function(){
        console.log(buff.join("\n"));
    });
    child.stdin.end(); //end input

}

exports.run = run;

