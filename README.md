# Neuron

The simplest possible event driven job manager, FIFO queue, and "task based cache" in node.js

## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing forever
<pre>
  [sudo] npm install neuron
</pre>

## Usage 
Neuron is not a simple job queue with support for a dynamic level of concurrency. It a way to manage jobs as they are created and completed in an async, event-driven manner. Heuristics for parallelization, ordering, and pooling are simple right now and jobs are processed in a FIFO order. 

More features may be added in the future, so keep me posted on how you use it.

### Managing Jobs
Managing jobs in neuron is easy. Neuron doesn't assume anything about the internal structure of the properties for each of your jobs except that they have a function called `work()`. Each JobManager is designed to process one instance of a Job.

Here's a quick sample of creating a manager and adding a job.

<pre>
  var util = require('util'),
      neuron = require('neuron'),
      manager = new neuron.JobManager();
      
  //
  // Create the manager and set the job.
  //
  var manager = new neuron.JobManager({ concurrency: 100 });
  manager.addJob('listDir', {
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
  });
</pre>

### Working with and Finishing Job instances
A JobManager will create a worker for the specified Job associated (i.e. add it to the job queue) each time the `enqueue()` method is called. All parameters passed to the enqueue method are passed on to the Job `work()` function. 

A Job function is 'finished' when it sets `this.finished = true`. This raises an event which is handled by the manager and re-emitted for the programmer. So when a worker completes, the JobManager raises the `finish` event:
<pre>
  //
  // Start a worker and listen for finish
  //
  manager.on('finish', function (job, worker) {
    //
    // Log the result from the worker (the directory listing for '/')
    //
    console.dir(worker.stdout);
  });
  
  //
  // All arguments passed to the enqueue() function after the job name
  // are consumed by the work() function passed to the job.
  //
  manager.enqueue('listDir', '/');
</pre>

#### Author: [Charlie Robbins](http://nodejitsu.com)