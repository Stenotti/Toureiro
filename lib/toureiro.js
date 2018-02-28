var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var redis = require('./redis');
var slashes = require('connect-slashes');

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
  router.route('/static_toureiro', express.static(path.join(__dirname, staticPath)));

  app.use(slashes());

  app.all('/', function (req, res) {
    res.render('index');
  });
  router.route('/queue', require('./routes/queue'));
  router.route('/job', require('./routes/job'));

  // app.use('*', function(req, res) {
  //   // Catch all
  //   res.sendStatus(404);
  // });

  return app;

};
