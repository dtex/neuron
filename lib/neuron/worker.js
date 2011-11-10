/*
 * worker.js: Runs individual instances of jobs being managed inside of neuron.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    neuron = require('../neuron');

//
// ### function Worker (workerId, job, args)
// #### @workerId {string} The id of this worker
// #### @job {Job} The job that this worker should run
// #### @args {Array} The arguments to pass to the `job.work()` function
// Constructor function for the Worker object which runs the specified arguments
// on the work() function of the given instance of neuron.Job.
//
var Worker = exports.Worker = function (workerId, job, args) {
  if (!workerId) throw new Error('workerId is required.');
  else if (!(job instanceof neuron.Job)) throw new Error('job must be an instanceof neuron.Job');
  
  this.id = workerId;
  this.job = job;
  this.args = args;
  
  this._finished = false;
  this.running = false;
};

// Inherity from events.EventEmitter
util.inherits(Worker, events.EventEmitter);

//
// ### function start (/* variable arguments */)
// @arguments {Array} Arguments to pass to the `work()` function
// Starts the `work()` function for the Job associated with this instance.
//
Worker.prototype.run = function () {
  this.running = true;
  this.emit('start');
  this.job.work.apply(this, this.args);
};

//
// ### get finished()
// Returns a value indicating whether this instance is finished or not
//
Worker.prototype.__defineGetter__('finished', function () {
  return this._finished;
});

//
// ### set finished (value)
// @value {boolean} A value indicating whether this instance is finished or not.
//
Worker.prototype.__defineSetter__('finished', function (value) {
  this._finished = value;
  if (value === true) {
    this.running = false;
    this.emit('finish');
  }
});

