/*
 * JobManager.js: Creates and manages jobs, workers and job results. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    jobber = require('jobber');

//
// ### function JobManager (options)
// #### @options {Object} Settings to use for this instance
// Constructor function for the JobManager object which manages a set of workers
// for a single instance of jobber.Job.
//
var JobManager = exports.JobManager = function (options) {
  options = options || {};
  
  if (options.job && !(options.job instanceof jobber.Job)) {
    throw new Error('job must be an instance of jobber.Job');
  }
  
  this.concurrency = options.concurrency || 50;
  this.job = options.job || {};
  this.running = {};
  this.waiting = {};
  this.queue = [];
};

// Inherit from events.EventEmitter
util.inherits(JobManager, events.EventEmitter);

//
// ### funtion JobManager.prototype.setJob (job)
// #### @job {Job} The job to use for this instance.
// Sets the job for this instance to manage.
//
JobManager.prototype.setJob = function (job) {
  if (this.queue.length > 0) throw new Error('Cannot setJob() with unfinished jobs in queue.');
  else if (!(job instanceof jobber.Job)) throw new Error('job must be an instance of jobber.Job');
  
  this.job = job;
};

//
// ### function start (/* variable arguments */)
// #### @arguments {variable} The arguments to pass to the running job.
// Creates a new instance of the Job managed by this instance
// by creating a new worker to run which takes `@arguments`. If the number of keys in 
// `this.running` exceeds `this.concurrency` the job is appended 
// to the `waiting` set and added to the `queue` managed by this instance.
//
JobManager.prototype.start = function () {
  if (!(this.job instanceof jobber.Job)) throw new Error('Cannot runNext() with no job to perform.');
  
  //
  // Create a unique id for this worker.
  //
  workerId = jobber.randomString(32);
  while (this.running[workerId] || this.waiting[workerId]) {
    workerId = jobber.randomString(32);
  }
  
  var self = this,
      worker = new jobber.Worker(workerId, this.job, Array.prototype.slice.call(arguments));
  
  worker.once('finish', function () {
    self._workComplete(worker);
  });
  
  if (Object.keys(this.running).length >= this.concurrency) {
    this.waiting[workerId] = worker;
    this.queue.push(workerId);
  }
  else {
    this.running[workerId] = worker;
    process.nextTick(function () {
      worker.run();
    });
  }
  
  return workerId;
};

//
// ### function JobManager.prototype.getWorker (workerId)
// #### @workerId {string} The id of the worker to retreive.
// Gets a worker with the specified id
//
JobManager.prototype.getWorker = function (workerId) {
  if (this.running[workerId]) {
    return this.running[workerId];
  }
  else if (this.waiting[workerId]) {
    return this.waiting[workerId];
  }
  
  return null;
};

//
// ### function _workComplete (worker)
// #### @worker {Worker} The worker who has just completed.
// Updates bookkeeping associated with this instance
// knowing that the given worker is now complete.
//
JobManager.prototype._workComplete = function (worker) {
  var self = this, nextWorker, nextId;
  
  // Wait a moment before indicating to the user that we are done
  process.nextTick(function () {
    self.emit('finish', worker);
    
    // If the queue is now empty, notify the user
    if (self.queue.length === 0) {
      self.emit('empty');
    }
  });
  
  delete this.running[worker.id];
  this._replenish();
};

//
// ### function _replenish ()
// Replenishes the running worker by dequeuing waiting workers from `this.queue`.
//
JobManager.prototype._replenish = function () {
  var self = this, running = Object.keys(this.running).length,
      workerId, started = [];
  
  if (this.queue.length === 0) return false;
  else if (running > this.concurrency) return false;
  
  while (running < this.concurrency && (workerId = this.queue.shift())) {
    //
    // Close over the workerId and the worker annoymously so we can
    // user `process.nextTick()` effectively without leakage.
    //
    (function (id, w) {
      started.push(id);
      //
      // Move the worker from the set of waiting workers to the set
      // of running workers
      //
      delete self.waiting[id];
      self.running[id] = w;
      
      //
      // Increment the length of the running workers manually
      // so we don't have to call `Object.keys(this.running)` again
      //
      running += 1;

      // Start the worker on the next tick.
      process.nextTick(function () {
        w.run();
      });
    })(workerId, this.waiting[workerId]);
  }
  
  return started;
};