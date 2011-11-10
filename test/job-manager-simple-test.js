/*
 * job-manager-simple-test.js: Tests unit tests for neuron module
 *
 * (C) 2010 Charlie Robbins
 *
 */
  
var fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    neuron = require('../lib/neuron'),
    helpers = require('./helpers');
    
var workerId;

vows.describe('neuron/job-manager/simple').addBatch({
  "When using an instance of the JobManager": {
    topic: function () {
      var manager = new neuron.JobManager();
      manager.addJob('listDir', {
        dirname: __dirname,
        work: helpers.listDir(100)
      });
      
      return manager;
    },
    "the enqueue() method": {
      topic: function (manager) {
        var that = this;
        
        manager.once('start', function () {
          manager.once('finish', function (job, worker) {
            that.callback(null, worker, workerId)
          });
        });
        
        workerId = manager.enqueue('listDir', path.join(__dirname, '..'));
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
        var worker = manager.getWorker('listDir', workerId);
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
    "the enqueue() method with a job name that doesnt exist should throw an error": function (manager) {
      assert.throws(function () { manager.enqueue('listDir', __dirname) });
    },
    "the addJob() method": {
      "when passed invalid parameters should throw an error": function (manager) {
        assert.throws(function () { manager.addJob('foo') });
        assert.throws(function () {
          manager.addJob('listDir', {
            dirname: __dirname,
            work: helpers.listDir(100)
          });
          manager.addJob('listDir', {
            dirname: __dirname,
            work: helpers.listDir(100)
          });
        });
      }
    }
  }
}).export(module);

