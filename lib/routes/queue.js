var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var Queue = require('../models/queue');
var Job = require('../models/job');

router.all('/', function (req, res) {
  console.log("QUEUE /");
  var qName = req.query.name;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Promise.join(
      Queue.total(qName),
      Job.total(qName, 'wait'),
      Job.total(qName, 'active'),
      Job.total(qName, 'delayed'),
      Job.total(qName, 'completed'),
      Job.total(qName, 'failed')
    ).then(function (results) {
      var jobData = {
        total: results[0],
        wait: results[1],
        active: results[2],
        delayed: results[3],
        completed: results[4],
        failed: results[5]
      };
      res.json({
        status: 'OK',
        queue: {
          name: qName,
          stats: jobData
        }
      });
    });
  })
});

router.all('/list', function (req, res) {
  console.log("QUEUE /list");
  Queue.list().then(function (queues) {
    res.json({
      status: 'OK',
      queues: queues
    });
  }).catch(function (err) {
    console.log(err.stack);
    res.json({
      status: 'FAIL',
      message: err.message
    });
  });
});


router.all('/remove', function (req, res) {
  console.log("remove")
  var qName = req.body.queue;
  var id = req.body.id;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Job.remove(qName, id).then(function () {
      res.json({
        status: 'OK'
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

router.all('/promote', function (req, res) {
  console.log("promote")
  var qName = req.body.queue;
  var id = req.body.id;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Job.promote(qName, id).then(function () {
      res.json({
        status: 'OK'
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

router.all('/rerun', function (req, res) {
  console.log("rerun")
  var qName = req.body.queue;
  var id = req.body.id;
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
        if (job.state !== 'completed' && job.state !== 'failed') {
          res.json({
            status: 'FAIL',
            message: 'Cannot rerun a job that is not completed or failed.'
          });
          return
        }
        var data = job.toData();
        var opts = JSON.parse(data.opts);
        if (opts.delay) {
          delete opts.delay;
        }
        var data = JSON.parse(data.data);
        return Job.add(qName, data, opts).then(function (job) {
          var data = job.toData();
          data.id = job.jobId;
          data.state = job.state;
          res.json({
            status: 'OK',
            job: data
          });
          return;
        });
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

router.all('/total/:type(((wait)|(active)|(delayed)|(completed)|(failed)))', function (req, res) {
  console.log("/total/:type(((wait)|(active)|(delayed)|(completed)|(failed)))")
  var qName = req.query.queue;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Job.total(qName, req.params.type).then(function (total) {
      res.json({
        status: 'OK',
        total: total
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

router.all('/fetch/:type(((wait)|(active)|(delayed)|(completed)|(failed)))', function (req, res) {
  console.log("/fetch/:type(((wait)|(active)|(delayed)|(completed)|(failed)))")
  var page = 0;
  if (req.query.page) {
    page = parseInt(req.query.page);
  }
  var limit = 30;
  if (req.query.limit) {
    limit = parseInt(req.query.limit);
  }
  var qName = req.query.queue;
  Queue.exists(qName).then(function (result) {
    if (!result) {
      res.json({
        status: 'FAIL',
        message: 'The queue does not exist.'
      });
      return
    }
    Job.fetch(qName, req.params.type, page * limit, limit).then(function (jobs) {
      var _jobs = [];
      for (var i in jobs) {
        var job = jobs[i];
        if (job && job.toData) {
          var data = job.toData();
          data.id = job.jobId;
          data.state = job.state;
          _jobs.push(data);
        } else {
          console.log('Job appears corrupt:', job);
        }
      }
      Job.total(qName, req.params.type).then(function (total) {
        res.json({
          status: 'OK',
          jobs: _jobs,
          total: total,
          page: page,
          limit: limit
        });
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