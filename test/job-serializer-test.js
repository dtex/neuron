/*
 * job-serializer-test.js: Tests for the neuron serializer.
 *
 * (C) 2010 Charlie Robbins
 *
 */

require.paths.unshift(require('path').join(__dirname, '..', 'lib'));
  
var vows = require('vows'),
    assert = require('assert'),
    neuron = require('neuron'),
    helpers = require('./helpers');

var str, obj;

vows.describe('vows/job-serializer').addBatch({
  "When using neuron": {
    "the stringify() method": {
      "should correctly serialize an object with functions": function () {
        str = neuron.stringify({
          foo: 'foo',
          one: 1,
          truthy: true,
          arr: [1, 'a', false],
          regexp: /^foobar/,
          now: new Date(),
          obj: {
            bar: 'bar',
            two: 2,
            falsy: false
          },
          fn: function (a, b) {
            return a + b;
          }
        });
        
        assert.isString(str);
      }
    },
    "the parse() method": {
      "should correctly deserialize an object with functions": function () {
        obj = neuron.parse(str);
        assert.equal(obj.foo, 'foo');
        assert.equal(obj.one, 1);
        assert.equal(obj.truthy, true);
        assert.instanceOf(obj.arr, Array);
        assert.length(obj.arr, 3);
        assert.isString(obj.now);
        
        assert.isObject(obj.obj);
        assert.equal(obj.obj.bar, 'bar');
        assert.equal(obj.obj.two, 2);
        assert.equal(obj.obj.falsy, false);
        
        assert.isFunction(obj.fn);
        assert.equal(obj.fn(1,2), 3);
      }
    }
  }
}).export(module);