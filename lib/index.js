'use strict';

var Factory = require('./factory');

var factory = new Factory();

module.exports = exports = function (name, descriptors, staticDescriptors) {
  return factory.create(name, descriptors, staticDescriptors);
};

exports.create = function (name, descriptors, staticDescriptors) {
  return factory.create(name, descriptors, staticDescriptors);
};

exports.extend = function (methods) {
  return Factory.extend(methods);
};

exports.Factory = Factory;
