var winston  = require('winston');
require('winston-loggly');
var bodyParser = require('body-parser');

winston.add(winston.transports.Loggly, {
  inputToken: "cac56fcd-2291-4e1d-be4e-fdb8611e09ff",
  subdomain: "qftgtr",
  tags: ["Mexue","Mexue-Android"],
  json: true
});

var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var pmx = require('pmx');

pmx.init({
  http          : true, // HTTP routes logging (default: true)
  errors        : true, // Exceptions loggin (default: true)
  custom_probes : true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network       : true, // Network monitoring at the application level
  ports         : true  // Shows which ports your app is listening on (default: false)
});

var nLogs = 0;
var nLogsMetric = pmx.probe().metric({
  name: 'nLogs'
});

var url = 'mongodb://localhost:27017/mx-logs';
// Use connect method to connect to the Server

var coll = null;
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Connected correctly to server");
  coll = db.collection('logs');

  coll.count({}, function(err, result) {
    if (err) throw err;
    nLogs = result;
    nLogsMetric.set(nLogs);
  });

  startServer();
//  db.close();
});

var app = express();
function startServer() {
  //app.use(bodyParser.json());
  //app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/api/logs/post', bodyParser.urlencoded({ extended: true }), function(req, res) {
    var query = req.body;

    if (query.phone) {
      var obj = {
        phone: query.phone,
        func: query.func || null,
        app_describe: query.app_describe || null,
        model_describe: query.model_describe || null,
        error_describe: query.error_describe || null,
        userId: query.userId || null,
        requestContent: query.requestContent || null,
        extend1: query.extend1 || null,
        extend2: query.extend2 || null,
        createdAt: new Date(),
      };
//      winston.info(obj);

      coll.insert(obj, function(err, result) {
        if (err) {
          res.json({success: false});
          return;
        }
        nLogs++;
        nLogsMetric.set(nLogs);
        obj = null;
        query = null;
        
        res.json({success: true});
      });
    } else {
      query = null;
      res.json({success: false});
    }
  });
  
  app.get('/api/logs/post', function(req, res) {
    res.json({success: false});
  });

  app.get('/api/logs/get', function(req, res) {
    var query = req.query,
        q = {};

    if (query.phone)
      q.phone = query.phone;

    coll.find(q, {_id: false}).limit(100).sort({timestamp: -1}).toArray(function(err, docs) {
      if (err) {
        res.json({success: false});
        throw err;
      }

      res.send(docs);
    });
  });

  app.listen(8080, '0.0.0.0', function () {
    console.log('Example app listening on port 8080!');
  });
}


pmx.action('db:size', function(reply) {
  coll.count({}, function(err, result) {
    if (err) reply(err);
    reply({size: result});
  });
});

pmx.action('db:clean', function(reply) {
  coll.remove({}, function(err) {
    nLogs = 0;
    nLogsMetric.set(nLogs);
    reply({success : true});
  });
});