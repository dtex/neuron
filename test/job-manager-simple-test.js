/*
 * neuron-test.js: Tests unit tests for neuron module
 *
 * (C) 2010 Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
  
var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    eyes = require('eyes'),
    vows = require('vows'),
    assert = require('assert'),
    neuron = require('neuron'),
    helpers = require('./helpers');
    
var workerId;

vows.describe('neuron/job-manager/simple').addBatch({
  "When using an instance of the JobManager": {
    topic: function () {
      var manager = new neuron.JobManager();
      manager.setJob(new neuron.Job('listDir', {
        dirname: __dirname,
        work: helpers.listDir(100)
      }));
      
      return manager;
    },
    "the start() method": {
      topic: function (manager) {
        var that = this;
        
        manager.once('finish', function (worker) {
          that.callback(null, worker, workerId)
        });
        
        workerId = manager.start(path.join(__dirname, '..'));
      },
      "should start off a job that returns results": function (err, worker, workerId) {
        assert.isNotNull(worker);
        assert.isString(worker.stdout);
        assert.equal(worker.id, workerId);
        assert.isTrue(worker.finished);
        assert.isFalse(worker.running);
      }
    },
    "the getWorker() method": {
      "should return a valid worker": function (manager) {
        var worker = manager.getWorker(workerId);
        assert.isNotNull(worker);
        assert.equal(worker.id, workerId);
        assert.equal(worker.finished, false);
        assert.equal(worker.running, true);
      }
    }
  }
}).addBatch({
  "When using an instance of the JobManager": {
    topic: function () {
      var manager = new neuron.JobManager();
      return manager;
    },
    "the start() method with no job should throw an error": function (manager) {
      assert.throws(function () { manager.start(__dirname) });
    },
    "the setJob() method": {
      "when passed invalid parameters should throw an error": function (manager) {
        assert.throws(function () { manager.setJob('foo') });
        manager.queue.unshift('foo');
        assert.throws(function () {
          manager.setJob(new neuron.Job('listDir', {
            dirname: __dirname,
            work: helpers.listDir(100)
          }));
        });
      }
    }
  }
}).export(module);