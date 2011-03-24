/*
 * job-serializer.js: Serializes and deserializes Job objects including work() functions.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var vm = require('vm'),
    neuron = require('neuron');

exports.stringify = function (obj) {
  var result = {};
  
  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] === 'function' && neuron.storeWork) {
      return result[key] = obj[key].toString();;
    }
    
    result[key] = obj[key];
  });
  
  return JSON.stringify(result);
};

exports.parse = function (str) {
  var obj = JSON.parse(str);
  
  Object.keys(obj).forEach(function (key) {
    //
    // **Remark _(indexzero)_**: There are obviously security concerns here, but you should 
    // be locking down who has access to your persistent data store for your jobs. Alternatively,
    // you can set `neuron.storeWork = false` and work functions will not get persisted. This
    // also means that remote clients with no worker code cannot function as worker drones in your
    // distributed cluster
    //
    if (/^function\s+\(/.test(obj[key])) {
      var get;
      obj[key] = neuron.storeWork ? vm.runInThisContext('get = ' + obj[key]) : obj[key];
    }
  });
  
  return obj;
};