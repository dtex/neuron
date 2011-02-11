# Jobber

The simplest possible event driven job manager / FIFO queue in node.js

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
Jobber is not a simple job queue with support for a dynamic level of concurrency. It a way to manage jobs as they are created and completed in an async, event-driven manner. Heuristics for parallelization, ordering, and pooling are simple right now and jobs are processed in a FIFO order. 

More features may be added in the future, so keep me posted on how you use it.

### Creating Jobs
Creating jobs in jobber is easy. Jobber doesn't assume anything about the internal structure of the properties for each of your jobs except that they have a function called `work()`. Each JobManager is designed to process one instance of a Job, creating many workers which may be added by calling the `start()` method.

Here's a quick sample of creating a manager and adding a job.

<pre>
  var util = require('util'),
      jobber = require('jobber'),
      manager = new jobber.JobManager();
      
  //
  // Create the manager and set the job.
  //
  var manager = new jobber.JobManager({ concurrency: 100 });
  manager.setJob(new jobber.Job('listDir', {
    dirname: __dirname,
    work: function (dirname) {
      var self = this;
      exec('ls -la ' + dirname || this.dirname, function (error, stdout, stderr) {
        if (error) self.error = error;
        else self.stdout = stdout;

        //
        // Finish the job, this will notify the manager.
        //
        self.finished = true;
      });
    }
  }));
</pre>

### Completing Jobs
An instance of `jobber.JobManager` raises the `finish` event every time a worker has set `finished = true`:
<pre>
  //
  // Start a worker and listen for finish
  //
  manager.on('finish', function (worker) {
    //
    // Log the result from the worker (the directory listing for '/')
    //
    console.dir(worker.stdout);
  });
  
  //
  // All arguments passed to the start() function are consumed by the worker
  //
  manager.start('/');
</pre>

#### Author: [Charlie Robbins](http://www.charlierobbins.com)