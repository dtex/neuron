/*
 * job-manager-cache-test.js: Tests unit tests for neuron module
 *
 * (C) 2010 Charlie Robbins
 *
 */

var fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    async = require('async'),
    neuron = require('../lib/neuron'),
    helpers = require('./helpers');

vows.describe('neuron/job-manager/cache').addBatch({
  "When working with pre-existing jobs in a WorkerCache": {
    topic: function () {
      var that = this, results = [], cache = new neuron.WorkerCache();
      
      async.forEach([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], function (i, next) {
        cache.add('test-job', i, [['foo', 'bar', 'baz', 'buzz', i].join('/')], next);
      }, function () {
        var manager = new neuron.JobManager({
          cache: true
        });
        
        manager.addJob('test-job', {
          work: helpers.waitAndRespond(100)
        });

        manager.on('finish', function (job, worker) {
          results.push(worker);
          if (worker.id === '9') {
            that.callback(null, results);
          }
        });
        
        manager.load();
      });
    },
    "should run the loaded jobs in the order specified": function (ign, results) {
      assert.lengthOf(results, 10);
      assert.equal(results[0].id, '0');
    }
  }
}).export(module);

