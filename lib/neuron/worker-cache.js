/*
 * worker-cache.js: Persists a specified job to Redis for single instance durability.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    async = require('async'),
    redis = require('redis'),
    neuron = require('../neuron');

//
// ### function WorkerCache (options)
// #### @options {Object} Options to use for this instance.
// Constructor function for the WorkerCache object. Caches worker 
// information in a remote Redis server. 
//
var WorkerCache = exports.WorkerCache = function (options) {
  options = typeof options === 'object' ? options : {};
  
  this.namespace = options.namespace || 'neuron';
  this.host = options.host || 'localhost';
  this.port = options.port || 6379;
  this.auth = options.auth;
  
  this.connect();
};

//
// ### function connect (host, port) 
// #### @host {string} **Optional** Host of the Redis server.
// #### @port {string} **Optional** Port of the Redis server.
// #### @auth {string} **Optional** Credentials for the Redis server.
// Connects to the remote Redis server for this instance.
//
WorkerCache.prototype.connect = function (host, port, auth) {
  host = host || this.host;
  port = port || this.port;
  auth = auth || this.auth;
  
  this.host = host;
  this.port = port;
  
  this.redis = redis.createClient(port, host);
  
  //
  // Set the authentication of the Redis server (if necessary).
  //
  if (auth) {
    this.redis.auth(auth);
  }
  
  //
  // Ignore errors from Redis for now.
  //
  this.redis.on('error', function () { });
};

//
// ### function close ()
// Closes the Redis connection associated with this instance.
//
WorkerCache.prototype.close = function () {
  this.redis.quit();
};

//
// ### function load (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Loads all data from the remove Redis server for this instance.
//
WorkerCache.prototype.load = function (callback) {
  var self = this, jobs = {}, workers = {};
  
  function getWorkers (name, next) {
    self.redis.smembers(self.key('workers', name), function (err, ids) {
      function getWorker (id, next) {
        self.redis.get(self.key('workers', name, id), function (err, worker) {
          if (err) {
            return next(err);
          }
          
          if (!workers[name]) {
            workers[name] = [];
          }
          
          var result = JSON.parse(worker);
          result.id = id;
          workers[name].push(result);
          next();
        });
      }
      
      async.forEachSeries(ids, getWorker, function (err) {
        return err ? next(err) : next();
      });
    });
  }
  
  this.redis.smembers(this.key('jobs'), function (err, names) {
    async.forEach(names, getWorkers, function (err) {
      if (callback) {
        return err ? callback(err) : callback(null, workers);
      }
    });  
  });  
};

//
// ### function add (name, workerId, args, callback)
// #### @name {string} Name of the job to add the worker to
// #### @workerId {string} Id of worker to add
// #### @args {Array} Arguments for the worker to add
// #### @callback {function} Continuation to pass control to when complete.
// Adds a new worker with `workerId` and `args to the job with the specified `name`.
//
WorkerCache.prototype.add = function (name, workerId, args, callback) {
  var self = this;
  this.redis.sadd(this.key('jobs'), name, function (err) {
    if (err) {
      return callback(err);
    }
    
    self.redis.sadd(self.key('workers', name), workerId, function (err) {
      if (err) {
        return callback(err);
      }

      self.redis.set(self.key('workers', name, workerId), JSON.stringify(args), function (err) {
        if (callback) {
          callback(err);
        }
      });
    });
  });
};

//
// ### function get (name, workerId, callback)
// #### @name {string} Name of the job to get the worker for
// #### @workerId {string} Id of worker to get
// #### @callback {function} Continuation to pass control to when complete.
// Gets the worker for the job with the specified `name` with `workerId`.
//
WorkerCache.prototype.get = function (name, workerId, callback) {
  this.redis.get(this.key('workers', name, workerId), function (err, worker) {
    if (callback) {
      var result = worker ? JSON.parse(worker) : worker;
      return err ? callback(err) : callback(null, result);
    }
  });
};

//
// ### function remove (name, workerId, callback)
// #### @name {string} Name of the job to remove the worker from
// #### @workerId {string} Id of worker to remove
// #### @callback {function} Continuation to pass control to when complete.
// Removes the worker with the specified `workerId` from this instance 
// for the job with the specified `name`.
//
WorkerCache.prototype.remove = function (name, workerId, callback) {
  var self = this;
  this.redis.srem(this.key('workers', name), workerId, function (err) {
    if (err) {
      return callback(err);
    }
    
    self.redis.del(self.key('workers', name, workerId), function (err) {
      if (callback) {
        callback(err);
      }
    });
  });
};

//
// ### function removeAll (name, callback)
// #### @name {string} Name of the job to remove all workers for
// #### @callback {function} Continuation to pass control to when complete.
// Removes all workers from this instance for the job with the specified `name`.
//
WorkerCache.prototype.removeAll = function (name, callback) {
  var self = this;
  this.redis.smembers(this.key('workers', name), function (err, ids) {
    if (err) {
      return callback(err);
    }
    
    function remove (id, next) {
      self.remove(name, id, next);
    }
    
    async.forEach(ids, remove, function (err) {
      if (callback) {
        return err ? callback(err) : callback(null);
      }
    });
  });
};

//
// ### function key (arguments)
// Returns the cache key for the specified `arguments`.
//
WorkerCache.prototype.key = function () {
  var args = Array.prototype.slice.call(arguments);
  
  args.unshift(this.namespace);
  return args.join(':');
};

