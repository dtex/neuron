/*
 * jobber.js: Creates and manages jobs and job results. 
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

require.paths.unshift(__dirname);

var jobber = exports;

//
// ### Export Components
// Export each of the core prototypes exposed by jobber.
//
jobber.JobManager = require('jobber/job-manager').JobManager;
jobber.Job        = require('jobber/job').Job;
jobber.Worker     = require('jobber/worker').Worker;

