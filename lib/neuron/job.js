/*
 * job.js: Simple data structure for tracking a predefined task (i.e. work() and default params). 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

//
// ### function Job (jobName, props)
// #### @jobName {string} The name to associate with this job (e.g. `directoryLister`)
// #### @props {Object} Properties to pass along to each worker instance created from this instance
// Constructor function for the Job object. Represents a specific task to be done repeatedly with
// possible default values and other metadata.
//
var Job = exports.Job = function (jobName, props) {
  if (!props.work) throw new Error("Worker function 'work()' is required.");
  else if (typeof props.finished !== 'undefined') throw new Error('finished is a reserved property');
  
  var self = this;
  this.jobName = jobName;
  Object.keys(props).forEach(function (property) {
    self[property] = props[property];
  });
};