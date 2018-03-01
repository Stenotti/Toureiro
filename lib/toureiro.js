var path = require('path');
var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var redis = require('./redis');
var slashes = require('connect-slashes');
var Promise = require('bluebird');

var Queue = require('./models/queue');
var Job = require('./models/job');

module.exports = function (config) {

  config = config || {};

  redis.init(config.redis || {});

  var app = express();

  router = express.Router();

  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());

  app.set('views', path.join(__dirname, '../views/templates'));
  app.set('view engine', 'pug');

  var staticPath = '../public';
  // if (config.development) {
  //   staticPath = '../public/dev';
  // }
  console.log(path.join(__dirname, staticPath))
  app.use('/static_toureiro', express.static(path.join(__dirname, staticPath)));

  app.use(slashes());

  app.all('/', function (req, res) {
    res.render('index');
  });
  app.use('/queue', require('./routes/queue'));
  app.use('/job', require('./routes/job'));

  // app.use('*', function(req, res) {
  //   // Catch all
  //   res.sendStatus(404);
  // });

  return app;

};
