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
    
var worker;

vows.describe('jobber/worker').addBatch({
  "When using an instance of a Worker": {
    "when passed invalid parameters": {
      "should throw an error": function () {
        // No params
        assert.throws(function () {
          var w = new jobber.Worker();
        });
        
        // No job
        assert.throws(function () {
          var w = new jobber.Worker('someId');
        });
        
        // Not an instance of jobber.Job
        assert.throws(function () {
          var w = new jobber.Worker('someId', function () { /* Purposefully Empty */ });
        });
      }
    },
    "setting 'finished' to true": {
      topic: function () {
        worker = new jobber.Worker('testId', new jobber.Job('empty', {
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