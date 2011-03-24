/*
 * JobManager.js: Creates and manages jobs, workers and job results. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    neuron = require('neuron');

//
// ### function JobManager (options)
// #### @options {Object} Settings to use for this instance
// Constructor function for the JobManager object which manages a set of workers
// for a single instance of neuron.Job.
//
var JobManager = exports.JobManager = function (options) {
  options = options || {};
  
  var self = this;
  this.concurrency = options.concurrency || 50;
  this.jobs = {};
  
  if (options.jobs) {
    Object.keys(options.jobs).forEach(function (name) {
      self.addJob(name, options.jobs[name]);
    });
  }
};

// Inherit from events.EventEmitter
util.inherits(JobManager, events.EventEmitter);

//
// ### funtion JobManager.prototype.addJob (name, props)
// #### @name {string} Name of the job to add to this instance.
// #### @props {Object} Properties to use for this job.
// Sets the job for this instance to manage.
//
JobManager.prototype.addJob = function (name, props) {
  if (this.jobs[name]) throw new Error('Job with name `' + name + '` already exists.');
  else if (!props) throw new Error('Cannot addJob with no attributes.');
  
  var self = this;
  props.concurrency = props.concurrency || this.concurrency;
  this.jobs[name] = new neuron.Job(name, props);

  this.jobs[name].on('start', function (worker) {
    self.emit('start', self.jobs[name], worker);
  });

  // Re-emit the finish event for each Job managed by this instance.
  this.jobs[name].on('finish', function (worker) {
    self.emit('finish', self.jobs[name], worker);
  });
  
  // Re-emit the empty event for each Job managed by this instance.
  this.jobs[name].on('empty', function () {
    self.emit('empty', self.jobs[name]);
  });
};

//
// ### function enqueue (name, /* variable arguments */)
// #### @name {string} Name of the job to start.
// #### @arguments {variable} The arguments to pass to the running job.
// Creates a new Worker instance for the Job managed by this instance with `name`
// by creating calling job.enqueue() with the specified `@arguments`. 
//
JobManager.prototype.enqueue = function (name) {
  if (Object.keys(this.jobs).length === 0) throw new Error('Cannot call start() with no job to perform.');
  else if (!this.jobs[name]) throw new Error('Cannot find job with name `' + name + '`.');
  
  return this.jobs[name].enqueue(Array.prototype.slice.call(arguments, 1));
};

//
// ### function remove (name, workerId)
// #### @name {string} Name of the job to remove the worker from.
// #### @workId {string} The ID of the worker to remove.
// Attempts to remove the worker with the specified `workerId` from the job
// managed by this instance with the specified `name`.
//
JobManager.prototype.remove = function (name, workerId) {
  if (Object.keys(this.jobs).length === 0) throw new Error('Cannot call remove() with no job to perform.');
  else if (!this.jobs[name]) throw new Error('Cannot find job with name `' + name + '`.');
  
  return this.jobs[name].remove(workerId);
};

//
// ### function JobManager.prototype.getWorker (name, workerId)
// #### @name {string} Name of the job to get the worker for.
// #### @workerId {string} The id of the worker to retreive.
// Gets a worker with the specified `workerId` for the job
// with the specified `name` named by this instance.
//
JobManager.prototype.getWorker = function (name, workerId) {
  if (!this.jobs[name]) throw new Error ('Cannot get worker for unknown job `' + name + '`');
  
  return this.jobs[name].getWorker(workerId);
};