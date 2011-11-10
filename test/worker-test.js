/*
 * worker-test.js: Tests unit tests for neuron module
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
    
var worker;

vows.describe('neuron/worker').addBatch({
  "When using an instance of a Worker": {
    "when passed invalid parameters": {
      "should throw an error": function () {
        // No params
        assert.throws(function () {
          var w = new neuron.Worker();
        });
        
        // No job
        assert.throws(function () {
          var w = new neuron.Worker('someId');
        });
        
        // Not an instance of neuron.Job
        assert.throws(function () {
          var w = new neuron.Worker('someId', function () { /* Purposefully Empty */ });
        });
      }
    },
    "setting 'finished' to true": {
      topic: function () {
        worker = new neuron.Worker('testId', new neuron.Job('empty', {
          work: function () { /* Purposefully empty */ }
        }));
        
        worker.on('finish', this.callback);
        worker.finished = true;
      },
      "should raise the 'finish' event": function () {
        assert.isTrue(worker.finished);
      }
    }
  }
}).export(module);

