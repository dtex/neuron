/*
 * jobber.js: Creates and manages jobs and job results. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var sys = require('sys'),
    events = require('events');

//
// function randomString (bits)
//   randomString returns a pseude-random ASCII string which contains at least the specified number of bits of entropy
//   the return value is a string of length ⌈bits/6⌉ of characters from the base64 alphabet
//
function randomString (bits) {
  var chars, rand, i, ret;
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  ret = '';
  
  //
  // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
  //
  while (bits > 0) {
    rand = Math.floor(Math.random()*0x100000000) // 32-bit integer
    // base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
    for (i=26; i>0 && bits>0; i-=6, bits-=6) { 
      ret+=chars[0x3F & rand >>> i];
    }
  }
  return ret;
};

var Job = exports.Job = function (jobId, props) {
  this.id = jobId;
  this._finished = false;
  
  if (props) {
    var self = this;
    Object.keys(props).forEach(function (property) {
      self[property] = props[property];
    });
  }
};

sys.inherits(Job, events.EventEmitter);

Job.prototype.__defineGetter__('finished', function (value) {
  return this._finished;
});

Job.prototype.__defineSetter__('finished', function (value) {
  this._finished = value;
  if (value) {
    this.emit('finish');
  }
});

var JobManager = exports.JobManager = function (options) {
  options = options || {};
  this.jobs = options.jobs || {};
};

sys.inherits(JobManager, events.EventEmitter);

//
// funtion JobManager.prototype.addJob ()
//   Adds a job to jobber
//
JobManager.prototype.addJob = function (props) {
  var self = this, jobId = randomString(32);
  while (Object.keys(this.jobs).indexOf(jobId) !== -1) {
    jobId = randomString(32);
  }
  
  var job = new Job(jobId, props);
  job.once('finish', function () {
    self.emit('finish', job);
  });
  
  this.jobs[jobId] = job;
  
  return job;
};

//
// function JobManager.prototype.getJob (jobId)
//   Gets a job with the specified id
//
JobManager.prototype.getJob = function (jobId) {
  if (this.jobs[jobId]) {
    return this.jobs[jobId];
  };
  
  return null;
};