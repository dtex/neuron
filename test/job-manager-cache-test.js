/*
 * job-manager-cache-test.js: Tests unit tests for neuron module
 *
 * (C) 2010 Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
  
var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    assert = require('assert'),
    async = require('async'),
    neuron = require('neuron'),
    helpers = require('./helpers');

vows.describe('neuron/job-manager/cache').addBatch({
  "When working with pre-existing jobs in a JobCache": {
    topic: function () {
      var that = this, cache = new neuron.JobCache();
      cache.addJob('test-job', {
        dirname: __dirname,
        work: helpers.listDir(100)
      });
      
      async.forEach([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], function (i, next) {
        cache.addWorker('test-job', i, [['foo', 'bar', 'baz', 'buzz', i].join('/')], next);
      }, function () {
        var manager = new neuron.JobManager({
          cache: true
        });
        
        manager.on('finished', that.callback);
        manager.load();
      });
    },
    "should do stuff": function () {
      require('eyes').inspect(arguments);
    }
  }
}).export(module);