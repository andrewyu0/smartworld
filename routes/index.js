
/*
 * GET home page.
 */

var Firebase = require('firebase');
var crypto = require('crypto');

exports.index = function(req, res){

  var clientIP = req.headers['x-forwarded-for'] || req.ip;
  console.log("request received from: " + clientIP) ;

  var shasum = crypto.createHash('sha1');
  shasum.update(clientIP);
  var location = shasum.digest('hex');

  var myRootRef = new Firebase('https://otto.firebaseio.com/');
  myRootRef.child(location).once('value', function(loc) {
    if (loc.val() === null) {
      myRootRef.child(location).set({on:true, h:0, s:0, b :1, a:1});
    }
  });
  res.render('index', { loc: location });
};