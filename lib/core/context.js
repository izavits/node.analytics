/**
* Provide context about the platform and OS
*/

var arch = require('arch');
var os = require('os');
var osLocale = require('os-locale');

var getArch = function getArch() {
  if (/ia32|x64/.test(process.arch)) {
    return arch().replace('x86', 'ia32');
  }
  return process.arch
};

module.exports.node = {
  arch: process.arch,
  node: process.version,
  osPlatform: os.platform(),
  osRelease: os.release(),
  cpuCores: os.cpus().length,
  totalMemory: os.totalmem(),
  startFreeMemory: os.freemem(),
  hostArch: getArch(),
  locale: osLocale.sync()
};
