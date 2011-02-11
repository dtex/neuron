/*
 * jobber-test.js: Tests unit tests for jobber module
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
    jobber = require('jobber'),
    helpers = require('./helpers');
    
var workerIds = [];

function createConcurrentBatch (message, nestedTest, timeout) {
  var batch = {
    "When using an instance of the JobManager": {
      topic: function () {
        var manager = new jobber.JobManager({ concurrency: 10 });
        manager.setJob(new jobber.Job('listDir', {
          dirname: __dirname,
          work: helpers.listDir(timeout || 3000)
        }));

        return manager;
      }
    }
  };
  
  var test, header = "when passed more jobs than the concurrency level allows";
  test = {
    topic: function (manager) {
      var that = this;
      for (var i = 0; i < 25; i++) {
        workerIds.push(manager.start(path.join(__dirname, '..')));
      }
      return manager;
    }
  };
  
  test[message] = nestedTest;
  
  batch[Object.keys(batch)[0]][header] = test;
  return batch;
}

vows.describe('jobber/job-manager/simple').addBatch(
  createConcurrentBatch("should have the correct number running and waiting", function (manager) {
    assert.equal(manager.queue.length, 15);
    assert.equal(Object.keys(manager.running).length, 10);
  })
).addBatch(
  createConcurrentBatch("and all of those jobs are complete", {
    topic: function (manager) {
      manager.on('empty', this.callback.bind(null, null, manager));
    },
    "should eventually fire the 'empty' event": function (manager) {
      assert.equal(manager.queue.length, 0);
    }
  }, 100)
).export(module);