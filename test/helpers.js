/*
 * helpers.js: Helpers for the neuron tests
 *
 * (C) 2010 Charlie Robbins
 *
 */

var exec = require('child_process').exec;

var helpers = exports;

helpers.listDir = function (timeout) {
  return function (dirname) {
    var self = this;
    setTimeout(function () {
      exec('ls -la ' + dirname || this.dirname, function (error, stdout, stderr) {
        if (error) self.error = error;
        else self.stdout = stdout;

        self.finished = true;
      });
    }, timeout);
  }
};

helpers.waitAndRespond = function (timeout) {
  return function (value) {
    var self = this;
    setTimeout(function () {
      self.data = value;
      self.finished = true;
    }, timeout);
  }
};