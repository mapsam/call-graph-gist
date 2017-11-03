var express = require('express');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var fs = require('fs');
var hat = require('hat');
var AWS = require('aws-sdk');
var cg2json = require('./cg2json');

var app = express();
module.exports.app = app;
app.set('port', (process.env.PORT || 5000));
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  return res.render('./index.html');
});

app.get('/:cgID', function(req, res) {
  var cgID = req.params.cgID;
  var s3 = new AWS.S3();
  var params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${cgID}.json`
  };

  s3.getObject(params, function(err, response) {
    if (err) {
      console.log(err);
      return res.render('./error.html', {message: `Uh oh! Call graph <strong>${cgID}</strong> cannot be found.`});
    }
    var data = JSON.parse(response.Body);
    return res.render('./call-graph.html', {cg: data});
  });
});

app.post('/new', function(req, res) {
  var s3 = new AWS.S3();
  var cgText = fs.readFileSync('./sample-graph.txt', 'utf8'); //req.body.text
  var cgjson = cg2json(cgText);
  cgjson.id = hat();

  var params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${cgjson.id}.json`,
    Body: new Buffer(JSON.stringify(cgjson)),
    ContentType: 'application/json'
  };

  s3.putObject(params, function(err, data) {
    if (err) {
      console.log(err);
      return res.render('./error.html', {message: `Uh oh! We weren't able to save that file.`});
    }
    return res.redirect(`/${cgjson.id}`);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
