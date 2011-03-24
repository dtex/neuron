/*
 * job-serializer.js: Serializes and deserializes Job objects including work() functions.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENSE
 *
 */

var vm = require('vm');

exports.stringify = function (obj) {
  var result = {};
  
  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] !== 'function') {
      return result[key] = obj[key];
    }
    
    result[key] = obj[key].toString();
  });
  
  return JSON.stringify(result);
};

exports.parse = function (str) {
  var obj = JSON.parse(str);
  
  Object.keys(obj).forEach(function (key) {
    if (/^function \((.*)\) \{\s*(.*)\s*\}/.test(obj[key])) {
      var x;
      obj[key] = vm.runInThisContext('x = ' + obj[key]);
    }
  });
  
  return obj;
};
