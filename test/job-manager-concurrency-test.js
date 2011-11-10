/*
 * job-manager-concurrency-test.js: Tests unit tests for neuron module
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
    
var workerIds = [];

var listProps = {
  dirname: __dirname,
  work: helpers.listDir(3000)
};

var fastListProps = {
  dirname: __dirname,
  work: helpers.listDir(100)
};

var waitProps = {
  work: helpers.waitAndRespond('testing', 30000)
};

function createConcurrentBatch (message, name, props, nestedTest) {
  var batch = {
    "When using an instance of the JobManager": {
      topic: function () {
        var manager = new neuron.JobManager({ concurrency: 10 });
        manager.addJob(name, props);

        return manager;
      }
    }
  };
  
  var test, header = "when passed more jobs than the concurrency level allows";
  test = {
    topic: function (manager) {
      var that = this;
      for (var i = 0; i < 25; i++) {
        workerIds.push(manager.enqueue(name, path.join(__dirname, '..')));
      }
      return manager;
    }
  };
  
  test[message] = nestedTest;
  
  batch[Object.keys(batch)[0]][header] = test;
  return batch;
}

vows.describe('neuron/job-manager/simple').addBatch(
  createConcurrentBatch("should have the correct number running and waiting", 'listDir', listProps, function (manager) {
    assert.equal(manager.jobs['listDir'].queue.length, 15);
    assert.equal(Object.keys(manager.jobs['listDir'].running).length, 10);
  })
).addBatch(
  createConcurrentBatch("and all of those jobs are complete", 'listDir', fastListProps, {
    topic: function (manager) {
      manager.once('empty', this.callback.bind(null, null, manager));
    },
    "should eventually fire the 'empty' event": function (manager) {
      assert.equal(manager.jobs['listDir'].queue.length, 0);
    }
  })
).addBatch(
  createConcurrentBatch("and the removeWorker() method is called", 'waitRespond', waitProps, {
    topic: function (manager) {
      Object.keys(manager.jobs['waitRespond'].waiting).forEach(function (id) {
        manager.removeWorker('waitRespond', id);
      });

      return manager;
    },
    "should remove the specified jobs": function (manager) {
      assert.equal(manager.jobs['waitRespond'].queue.length, 0);
    }
  }, 30000)
).export(module);

