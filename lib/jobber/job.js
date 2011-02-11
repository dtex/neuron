/*
 * job.js: Simple data structure for tracking a predefined task (i.e. work() and default params). 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var Job = exports.Job = function (jobName, props) {
  if (!props.work) throw new Error("Worker function 'work()' is required.");
  else if (typeof props.finished !== 'undefined') throw new Error('finished is a reserved property');
  
  var self = this;
  this.jobName = jobName;
  Object.keys(props).forEach(function (property) {
    self[property] = props[property];
  });
};