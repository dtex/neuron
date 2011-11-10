/*
 * worker-cache-test.js: Tests for the neuron WorkerCache.
 *
 * (C) 2010 Charlie Robbins
 *
 */

var vows = require('vows'),
    assert = require('assert'),
    neuron = require('../lib/neuron'),
    helpers = require('./helpers');

vows.describe('neuron/worker-cache').addBatch({
  "An instance of the neuron WorkerCache": {
    topic: new neuron.WorkerCache({ host: 'localhost' }),
    "should have the correct methods": function (cache) {
      assert.isFunction(cache.connect);
      assert.isFunction(cache.close);
      assert.isFunction(cache.load);
      assert.isFunction(cache.add);
      assert.isFunction(cache.get);
      assert.isFunction(cache.remove);
      assert.isFunction(cache.removeAll);
      assert.isFunction(cache.key);
    },
    "the add() method": {
      topic: function (cache) {
        cache.add('test-job', '1234', [
          '/foo/bar/baz/buzz'
        ], this.callback.bind(null, null));
      },
      "should add the Worker to the cache": function (ign, err) {
        assert.isNull(err);
      }
    }
  }
}).addBatch({
  "An instance of the neuron WorkerCache": {
    topic: new neuron.WorkerCache({ host: 'localhost' }),
    "the get() method": {
      topic: function (cache) {
        cache.get('test-job', '1234', this.callback);
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
      "should respond with the set of jobs and workers": function (err, workers) {
        assert.isNull(err);
        assert.isObject(workers);
        assert.isArray(workers['test-job']);
        assert.isArray(workers['test-job'][0]);
        assert.equal(workers['test-job'][0].id, '1234');
        assert.equal(workers['test-job'][0][0], '/foo/bar/baz/buzz');
      }
    }
  }
}).addBatch({
  "An instance of the neuron WorkerCache": {
    topic: new neuron.WorkerCache({ host: 'localhost' }),
    "the removeAll() method": {
      topic: function (cache) {
        cache.removeAll('test-job', this.callback.bind(null, null));
      },
      "should correctly remove the job": function (err) {
        assert.isNull(err);
      }
    }
  }
}).addBatch({
  "An instance of the neuron WorkerCache": {
    "after a job and workers have been removed": {
      topic: new neuron.WorkerCache({ host: 'localhost' }),
      "the get() method": {
        topic: function (cache) {
          cache.get('test-job', '1234', this.callback);
        },
        "should respond with null": function (err, job) {
          assert.isNull(err);
          assert.isNull(job);
        }
      }
    }
  }
}).export(module);

