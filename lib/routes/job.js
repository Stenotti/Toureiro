var _ = require('lodash');
var express = require('express');
var router = express.Router();
var Queue = require('../models/queue');
var Job = require('../models/job');

router.all('/', function (req, res) {
  console.log("ALL /")
  var qName = req.query.queue;
  var id = req.query.id;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Job.get(qName, id).then(function (job) {
      if (job) {
        var data = job.toData();
        data.id = job.jobId;
        data.state = job.state;
        res.json({
          status: 'OK',
          job: data
        });
        return;
      }
      res.json({
        status: 'FAIL',
        message: 'The job does not exist.'
      });
    }).catch(function (err) {
      console.log(err.stack);
      res.json({
        status: 'FAIL',
        message: err.message
      });
    });
  });
});

module.exports = router;