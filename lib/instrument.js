var fs = require('fs'),
    xml = require('xmldom');


function readFile(file) {
    file = __dirname + "/" + file;
    var size = fs.statSync(file).size,
        buf = new Buffer(size),
        fd = fs.openSync(file, 'r');
    if (!size) {
        return "";
    }
    fs.readSync(fd, buf, 0, size, 0);
    fs.closeSync(fd);
    return buf.toString();
}

exports.instrument = function(folder) {
    var file = readFile(folder + '/default.html');
    console.log(file);
};

