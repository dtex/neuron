/*
 * jobber-test.js: Tests for jobber module
 *
 * (C) 2010 Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
  
var sys = require('sys'),
    fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    jobber = require('jobber');
    
var testJob;

vows.describe('jobber').addBatch({
  "When using an instance of the JobManager": {
    topic: function () {
      var manager = new jobber.JobManager();
      testJob = manager.addJob({ user: 'bar' });
      
      return manager;
    },
    "the addJob() method": {
      "should return a valid job": function (manager) {
        var job = manager.addJob({ user: 'foo' });
        assert.isNotNull(job);
        assert.include(job, 'id');
        assert.equal(job.finished, false);
        assert.equal(job.user, 'foo');
      }
    },
    "the getJob() method": {
      "should return a valid job": function (manager) {
        var job = manager.getJob(testJob.id);
        assert.isNotNull(job);
        assert.include(job, 'id');
        assert.equal(job.id, testJob.id);
        assert.equal(job.finished, false);
        assert.equal(job.user, 'bar');
      }
    }
  }
}).addBatch({
  "When using an instance of a Job": {
    "setting 'finished' to true": {
      topic: function () {
        testJob.on('finish', this.callback);
        testJob.finished = true;
      },
      "should raise the 'finish' event": function () {
        assert.isTrue(testJob.finished);
      }
    }
  }
}).export(module);