/*jslint node:true, sloppy: true */
var buildBranch = require('./buildbranch-p');

buildBranch({
  branch: 'master',
  ignore: ['.git', 'www', 'node_modules'],
  folder: 'www'
}, function (err) {
  if (err) {
    throw err;
  }
  console.log('Published!');
});

