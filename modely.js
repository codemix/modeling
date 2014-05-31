"use strict";

var Classer = require('classer');

var Modely = Classer.extend({
  makeStatic: function (Class, descriptors) {
    Classer.makeStatic.call(this, Class, descriptors);
    var stashed = {
      defineProperty: Class.defineProperty,
      defineProperties: Class.defineProperties
    };
    Object.defineProperties(Class, {
      defineProperty: {
        value: function (name, descriptor, skipReload) {
          stashed.defineProperty.call(this, name, descriptor, skipReload);
          if (!skipReload && (!this.prototype.validate || this.prototype.validate.isAutoGenerated)) {
            this.prototype.validate = this.makeValidate(descriptors);
          }
          return this;
        }
      },
      defineProperties: {
        value: function (items) {
          stashed.defineProperties.call(this, items);
          this.prototype.validate = this.makeValidate(descriptors);
          return this;
        }
      },
      makeValidate: {
        configurable: true,
        value: function (descriptors) {
          return function () {};
        }
      }
    });
  },
  makePrototype: function (Class, descriptors) {
    Classer.makePrototype.call(this, Class, descriptors);
    // don't overwrite custom validate functions if supplied.
    if (!descriptors.validate) {
      Object.defineProperty(Class.prototype, 'validate', {
        configurable: true,
        writable: true,
        value: Class.makeValidate(descriptors)
      });
    }
  }
});


module.exports = Modely;