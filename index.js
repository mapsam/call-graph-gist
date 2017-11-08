var express = require('express');
var ejs = require('ejs');
var path = require('path');
var bodyParser = require('body-parser');
var multer = require('multer');
var hat = require('hat');
var AWS = require('aws-sdk');
var timestamp = require('time-stamp');
var favicon = require('serve-favicon');
var cg2json = require('./cg2json');

var app = express();
module.exports.app = app;
app.set('port', (process.env.PORT || 5000));
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

var upload = multer({
  storage: multer.memoryStorage()
});

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
    console.log('about to get the key', params);
    if (err) {
      console.log(err);
      return res.render('./error.html', {message: `Uh oh! Call graph <strong>${cgID}</strong> cannot be found.`});
    }
    var data = JSON.parse(response.Body);
    return res.render('./call-graph.html', {cg: data});
  });
});

app.post('/new', upload.single('cgtext'), function(req, res) {
  if (!req.file) {
    return res.render('./error.html', {message: `Hmmm, there wasn't a callgraph document included in the form submission. Please try again!`});
  }

  var cgstring = req.file.buffer.toString('utf8');
  var cgjson = cg2json(cgstring);
  cgjson.id = hat();
  cgjson.name = req.body.name || 'Callgraph';
  cgjson.created = timestamp('YYYY-MM-DD HH:mm:ss');

  var s3 = new AWS.S3();
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
