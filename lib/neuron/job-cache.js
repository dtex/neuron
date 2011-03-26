/*
 * job-cache.js: Persists a specified job to Redis for single instance durability.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    events = require('events'),
    async = require('async'),
    redis = require('redis'),
    neuron = require('neuron');
    
var JobCache = exports.JobCache = function (options) {
  options = typeof options === 'object' ? options : {};
  
  this.namespace = options.namespace || 'neuron';
  this.host = options.host || 'localhost';
  this.port = options.port || 6379;
  
  this.connect();
};

JobCache.prototype.connect = function (host, port) {
  host = host || this.host;
  port = port || this.port;
  
  this.host = host;
  this.port = port;
  
  this.redis = redis.createClient(port, host);
};

JobCache.prototype.close = function () {
  this.redis.quit();
};

JobCache.prototype.load = function (callback) {
  var self = this, jobs = {}, workers = {};
  
  function getJob (name, next) {
    self.redis.get(self.key('job', name), function (err, job) {
      if (err) {
        return next(err);
      }
      
      jobs[name] = neuron.parse(job);
      self.redis.smembers(self.key('workers', name), function (err, ids) {
        function getWorker (name) {
          return function (id, next) {
            self.redis.get(self.key('workers', name, id), function (err, worker) {
              if (err) {
                return next(err);
              }
              
              if (!workers[name]) {
                workers[name] = [];
              }
              
              var result = neuron.parse(worker);
              result.id = id;
              workers[name].push(result);
              next();
            });
          };
        }
        
        async.forEachSeries(ids, getWorker(name), function (err) {
          return err ? next(err) : next();
        });
      });
    })
  }
  
  this.redis.smembers(this.key('jobs'), function (err, names) {
    async.forEach(names, getJob, function (err) {
      if (callback) {
        return err ? callback(err) : callback(null, jobs, workers);
      }
    });  
  });  
};

JobCache.prototype.addJob = function (name, props, callback) {
  var self = this;
  this.redis.sadd(this.key('jobs'), name, function (err) {
    if (err) {
      return callback(err);
    }
    
    self.redis.set(self.key('job', name), neuron.stringify(props), function (err) {
      if (callback) {
        callback(err);
      }
    });
  });
};

JobCache.prototype.getJob = function (name, callback) { 
  this.redis.get(this.key('job', name), function (err, job) {
    if (callback) {
      var result = job ? neuron.parse(job) : job;
      return err ? callback(err) : callback(null, result);
    }
  });
};

JobCache.prototype.removeJob = function (name, callback) {
  var self = this;
  this.redis.srem(this.key('jobs'), name, function (err) {
    if (err) {
      return callback(err);
    }
    
    self.redis.del(self.key('job', name), function (err) {
      self.removeWorkers(name, function (err) {
        if (callback) {
          callback(err);
        }
      });
    });
  });
};

JobCache.prototype.addWorker = function (name, workerId, args, callback) {
  var self = this;
  this.redis.sadd(this.key('workers', name), workerId, function (err) {
    if (err) {
      return callback(err);
    }
    
    self.redis.set(self.key('workers', name, workerId), neuron.stringify(args), function (err) {
      if (callback) {
        callback(err);
      }
    });
  });
};

JobCache.prototype.getWorker = function (name, workerId, callback) {
  this.redis.get(this.key('workers', name, workerId), function (err, worker) {
    if (callback) {
      var result = worker ? neuron.parse(worker) : worker;
      return err ? callback(err) : callback(null, result);
    }
  });
};

JobCache.prototype.removeWorker = function (name, workerId, callback) {
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

JobCache.prototype.removeWorkers = function (name, callback) {
  var self = this;
  this.redis.smembers(this.key('workers', name), function (err, ids) {
    if (err) {
      return callback(err);
    }
    
    function remove (id, next) {
      self.removeWorker(name, id, next);
    }
    
    async.forEach(ids, remove, function (err) {
      if (callback) {
        return err ? callback(err) : callback(null);
      }
    });
  });
};

JobCache.prototype.key = function () {
  var args = Array.prototype.slice.call(arguments);
  
  args.unshift(this.namespace);
  return args.join(':');
};