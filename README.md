# Jobber

The simplest possible event driven job manager in node.js

## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing forever
<pre>
  [sudo] npm install jobber
</pre>

## Usage 
Jobber is not a "job queue" (not yet anyway). It is simply a way to manage jobs as they are created and completed. Heuristics for parallelization, ordering, and pooling are left to the programmer. These features may be added in the future, but for now they are not included.

### Creating Jobs
Creating jobs in jobber is easy. Jobber doesn't assume anything about the internal structure of the properties for each of your jobs. Here's a quick sample of creating a job:

<pre>
  var jobber = require('jobber'),
      manager = new jobber.JobManager();
      
  var job = manager.addJob({ results: [] });
</pre>

### Working with Jobs
Once we have created a job, we can flexibly set properties on it and pass it around to any data transform or operation.
<pre>
  var remoteResults = someRemote.operation();
  remoteResults.forEach(function (result) {
    //
    // Perform some async operation on the result
    //
    job.results.push(result);
  });
</pre>

### Completing Jobs
A job raises the finished event once the finished property is set to true:
<pre>
  jobManager.on('finished', function (job) {
    //
    // Do something with the now finished job.
    //
  });
  
  job.finished = true;
</pre>

#### Author: [Charlie Robbins](http://www.charlierobbins.com)