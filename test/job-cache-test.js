/*
 * job-cache.js: Tests for the neuron JobCache.
 *
 * (C) 2010 Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
  
var vows = require('vows'),
    assert = require('assert'),
    neuron = require('neuron'),
    helpers = require('./helpers');

vows.describe('neuron/job-cache').addBatch({
  "An instance of the neuron JobCache": {
    topic: new neuron.JobCache({ host: 'localhost' }),
    "should have the correct methods": function (cache) {
      assert.isFunction(cache.connect);
      assert.isFunction(cache.close);
      assert.isFunction(cache.load);
      assert.isFunction(cache.addJob);
      assert.isFunction(cache.removeJob);
      assert.isFunction(cache.addWorker);
      assert.isFunction(cache.removeWorker);
      assert.isFunction(cache.key);
    },
    "the addJob() method": {
      topic: function (cache) {
        cache.addJob('test-job', {
          dirname: __dirname,
          work: helpers.listDir(100)
        }, this.callback.bind(null, null));
      },
      "should add the Job to the cache": function (ign, err) {
        assert.isNull(err);
      }
    },
    "the addWorker() method": {
      topic: function (cache) {
        cache.addWorker('test-job', '1234', [
          '/foo/bar/baz/buzz'
        ], this.callback.bind(null, null));
      },
      "should add the Worker to the cache": function (ign, err) {
        assert.isNull(err);
      }
    }
  }
}).addBatch({
  "An instance of the neuron JobCache": {
    topic: new neuron.JobCache({ host: 'localhost' }),
    "the getJob() method": {
      topic: function (cache) {
        cache.getJob('test-job', this.callback);
      },
      "should return the correct job": function (err, job) {
        assert.isNull(err);
        assert.isFunction(job.work);
        assert.equal(job.dirname, __dirname);
      }
    },
    "the getWorker() method": {
      topic: function (cache) {
        cache.getWorker('test-job', '1234', this.callback);
      },
      "should respond with the correct worker": function (err, worker) {
        assert.isNull(err);
        assert.equal(worker[0], '/foo/bar/baz/buzz');
      }
    },
    "the load() method": {
      topic: function (cache) {
        cache.load(this.callback);
      },
      "should respond with the set of jobs and workers": function (err, jobs, workers) {
        assert.isNull(err);
        assert.isObject(jobs['test-job']);
        assert.equal(jobs['test-job'].dirname, __dirname);
        assert.isFunction(jobs['test-job'].work);
        assert.isArray(workers['test-job']);
        assert.isObject(workers['test-job'][0]);
        assert.equal(workers['test-job'][0].id, '1234');
        assert.equal(workers['test-job'][0][0], '/foo/bar/baz/buzz');
      }
    }
  }
}).addBatch({
  "An instance of the neuron JobCache": {
    topic: new neuron.JobCache({ host: 'localhost' }),
    "the removeJob() method": {
      topic: function (cache) {
        cache.removeJob('test-job', this.callback.bind(null, null));
      },
      "should correctly remove the job": function (err) {
        assert.isNull(err);
      }
    }
  }
}).addBatch({
  "An instance of the neuron JobCache": {
    "after a job and workers have been removed": {
      topic: new neuron.JobCache({ host: 'localhost' }),
      "the getJob() method": {
        topic: function (cache) {
          cache.getJob('test-job', this.callback);
        },
        "should respond with null": function (err, job) {
          assert.isNull(err);
          assert.isNull(job);
        }
      },
      "the getWorker() method": {
        topic: function (cache) {
          cache.getWorker('test-job', '1234', this.callback);
        },
        "should respond with null": function (err, worker) {
          assert.isNull(err);
          assert.isNull(worker);
        }
      }
    }
  }
}).export(module);