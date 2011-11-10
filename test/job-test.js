/*
 * job-test.js: Tests unit tests for neuron module
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

vows.describe('neuron/job').addBatch({
  "When using an instance of a Job": {
    "when passed invalid parameters": {
      "should throw an error": function () {
        // No params
        assert.throws(function () {
          var j = new neuron.Job();
        });
        
        // No work
        assert.throws(function () {
          var j = new neuron.Worker('someId');
        });
        
        // Pass finished
        assert.throws(function () {
          var j = new neuron.Worker('someId', {
            work: function () { /* Purposefully Empty */ },
            finished: false
          });
        });
      }
    },
    "when passed valid parameters": {
      topic: function () {
        var job = new neuron.Job('testJob', {
          work: function () { /* Purposefully empty */ },
          someProp: true,
          someObj: {
            aparam: 'value'
          }
        });
        
        return job;
      },
      "should copy the properties to the instance": function (job) {
        assert.equal(job.name, 'testJob');
        assert.equal(job.someProp, true);
        assert.isObject(job.someObj);
        assert.isString(job.someObj.aparam);
      }
    }
  }
}).export(module);

