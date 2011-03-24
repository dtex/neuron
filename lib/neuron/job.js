/*
 * job.js: Simple data structure for tracking a predefined task (i.e. work() and default params). 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var util = require('util'),
    events = require('events'),
    neuron = require('neuron');

//
// ### function Job (jobName, props)
// #### @jobName {string} The name to associate with this job (e.g. `directoryLister`)
// #### @props {Object} Properties to pass along to each worker instance created from this instance
// Constructor function for the Job object. Represents a specific task to be done repeatedly with
// possible default values and other metadata.
//
var Job = exports.Job = function (name, props) {
  if (!props.work) throw new Error('Worker function `work()` is required.');
  else if (props['finished']) throw new Error('`finished` is a reserved property.');
  
  events.EventEmitter.call(this);
  
  this.name = name;
  this.running = {};
  this.waiting = {};
  this.queue = [];
  this.concurrency = props.concurrency || 50;
  
  var self = this;
  Object.keys(props).forEach(function (property) {
    self[property] = props[property];
  });
};

util.inherits(Job, events.EventEmitter);

//
// ### function enqueue (name, /* variable arguments */)
// #### @arguments {variable} The arguments to pass to the running job.
// Creates a new Worker instance for this instance which takes `@arguments`. 
// If the number of keys in  `this.running` exceeds `this.concurrency` the job is appended 
// to the `waiting` set and added to the `queue` managed by this instance.
//
Job.prototype.enqueue = function () {
  //
  // Create a unique id for this worker.
  //
  var self = this, workerId = neuron.randomString(32), worker;
  while (this.running[workerId] || this.waiting[workerId]) {
    workerId = neuron.randomString(32);
  }
  
  var worker = new neuron.Worker(workerId, this, Array.prototype.slice.call(arguments));
  
  worker.on('start', function () {
    self.emit('start', self, worker);
  });
  
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

Job.prototype.remove = function (workerId) {
  if (this.running[workerId]) {
    return false;
  }
  else if (this.waiting[workerId]) {
    this.queue.splice(this.queue.indexOf(workerId), 1);
    delete this.waiting[workerId];
    return true;
  }
  
  return null;
};

//
// ### function JobManager.prototype.getWorker (workerId)
// #### @workerId {string} The id of the worker to retreive.
// Gets a worker with the specified id
//
Job.prototype.getWorker = function (workerId) {
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
Job.prototype._workComplete = function (worker) {
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
Job.prototype._replenish = function () {
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