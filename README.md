# Neuron [![Build Status](https://secure.travis-ci.org/flatiron/neuron.png)](http://travis-ci.org/flatiron/neuron)

The simplest possible event driven job manager, FIFO queue, and "task based cache" in node.js

## Installation

### Installing npm (node package manager)
``` bash
  curl http://npmjs.org/install.sh | sh
```

### Installing neuron
``` bash
  $ [sudo] npm install neuron
```

## Usage 
Neuron is a simple job queue with support for granular concurrency and persistent worker storage. It provides a way to manage jobs as they are created and completed in an async, event-driven manner. Heuristics for parallelization, ordering, and pooling are simple right now and jobs are processed in a FIFO order. 

### Managing Jobs
Managing jobs in neuron is easy. Neuron doesn't assume anything about the internal structure of the properties for each of your jobs except that they have a function called `work()`. The `concurrency` property is also useful but optional. If it isn't specified, neuron defaults to running 50 concurrent jobs.

Here's a quick sample of managing a single job called `listDir` with neuron.

``` js
  var util = require('util'),
      neuron = require('neuron');
      
  //
  // Create the manager and set the job.
  //
  var manager = new neuron.JobManager();
  manager.addJob('listDir', {
    dirname: __dirname,
    concurrency: 25,
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
```

### Working with and Finishing Job instances
A JobManager will create a worker for the specified Job associated (i.e. add it to the job queue) each time the `enqueue()` method is called. All parameters passed to the enqueue method are passed on to the Job `work()` function. 

A Job function is 'finished' when it sets `this.finished = true`. This raises an event which is handled by the manager and re-emitted for the programmer. So when a worker completes, the JobManager raises the `finish` event:

``` js
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
```

### Using the Persistent WorkerCache
Neuron has a built-in WorkerCache that stores the ordering and arguments to your workers for single instance durability. You don't have to worry about all the cache consistency nonsense though, just include the `cache` property when creating a JobManager.

``` js
  var manager = new neuron.JobManager({
    cache: {
      host: 'localhost',
      port: 6379
    }
  });
  
  manager.addJob('delayAdd', {
    work: function (a, b, c) {
      var self = this;
      setTimeout(function () {
        self.result = a + b + c;
        self.finished = true;
      }, 1000);
    }
  });
```

If there are any workers stored in your Redis server, you can load them by calling `manager.load()`. The manager will emit the `load` event when it is finished. Make sure that you have already added your jobs to your neuron JobManager before calling load or they will not be placed in the queue for that job.

``` js
  manager.on('finish', function (job, worker) {
    //
    // Log the output from the delayed addition
    //
    console.log(worker.result);
  });

  manager.on('load', function () {
    console.log('This will be called before any `finish` events');
  })
  
  manager.load();
```

#### Author: [Charlie Robbins](http://nodejitsu.com)
