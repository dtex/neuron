/*
 * worker.js: Runs individual instances of jobs being managed inside of jobber.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    jobber = require('jobber');

var Worker = exports.Worker = function (workerId, job, args) {
  if (!workerId) throw new Error('workerId is required.');
  else if (!(job instanceof jobber.Job)) throw new Error('job must be an instanceof jobber.Job');
  
  this.id = workerId;
  this.job = job;
  this.args = args;
  
  this._finished = false;
  this.running = false;
};

util.inherits(Worker, events.EventEmitter);

Worker.prototype.run = function () {
  this.running = true;
  this.job.work.apply(this, this.args);
};

Worker.prototype.__defineGetter__('finished', function (value) {
  return this._finished;
});

Worker.prototype.__defineSetter__('finished', function (value) {
  this._finished = value;
  if (value === true) {
    this.running = false;
    this.emit('finish');
  }
});
