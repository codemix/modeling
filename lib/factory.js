'use strict';

var ClassFactory = require('classing').Factory,
    Casting = require('casting'),
    Validating = require('validating');

module.exports = ClassFactory.extend({
  /**
   * Create a constructor function for a class.
   *
   * @param  {String} name The name of the class.
   *
   * @return {Function} The constructor function.
   */
  createConstructor: function (name) {
    var body = 'return function ' + name + ' (config) {\n\
                  if (!(this instanceof ' + name + ')) {\n\
                    return new ' + name + '(config);\n\
                  }\n\
                  this["[[state]]"] = {};\n\
                  this.applyDefaults();\n\
                  if (config) { this.configure(config); }\n\
                  this.initialize();\n\
                };';
    return (new Function(body))(); // jshint ignore: line
  },
  /**
   * Create a prototype for the given Class + descriptors.
   *
   * @param  {Function} Class       The class.
   * @param  {Object}   descriptors The property descriptors.
   *
   * @return {Object} The descriptors for the default prototype.
   */
  createDefaultPrototype: function (Class, descriptors) {
    var proto = this.__super__.createDefaultPrototype.call(this, Class, descriptors);
    proto['[[state]]'] = {
      enumerable: false,
      configurable: false,
      writable: true
    };
    proto.forEach = {
      enumerable: false,
      configurable: false,
      writable: true,
      value: this.createForEach(Class, descriptors)
    };
    proto.keys = {
      enumerable: false,
      configurable: false,
      writable: true,
      value: this.createKeys(Class, descriptors)
    };
    return proto;
  },
  /**
   * Create a `forEach` function for a class.
   *
   * @param  {Function} Class       The class.
   * @param  {Object}   descriptors The property descriptors.
   *
   * @return {Function} The forEach function.
   */
  createForEach: function (Class, descriptors) {
    var body = 'thisContext = thisContext || this;\n';
    each(descriptors, function (descriptor, name) {
      var accessor = createAccessor(name);
      body += 'if (this'+accessor+' !== undefined) {\n\
                 fn.call(thisContext, this'+accessor+', '+JSON.stringify(name)+', this);\n\
               }';
    });
    return this.createDynamicFunction('fn', 'thisContext', body);
  },
  /**
   * Create a `keys` function for a class.
   *
   * @param  {Function} Class       The class.
   * @param  {Object}   descriptors The property descriptors.
   *
   * @return {Function} The keys function.
   */
  createKeys: function (Class, descriptors) {
    var keys = [];
    each(descriptors, function (descriptor, name) {
      if (descriptor.enumerable) {
        keys.push(name);
      }
    });
    keys.sort();
    var body = 'return ' + JSON.stringify(keys) + ';';
    return this.createDynamicFunction(body);
  },

  /**
   * Normalize a descriptor.
   *
   * @param  {String} name        The name of the descriptor.
   * @param  {mixed}  descriptor  The raw descriptor or value.
   *
   * @return {Object} The normalized descriptor.
   */
  normalizeDescriptor: function (name, descriptor) {
    var normalized = this.__super__.normalizeDescriptor.call(this, name, descriptor);
    if (typeof normalized.value !== 'function' &&
        typeof normalized.get !== 'function' &&
        typeof normalized.set !== 'function' &&
        normalized.writable !== false
    ) {
      return this.wrapDescriptor(name, normalized);
    }
    else {
      return normalized;
    }
  },
  /**
   * Wrap a descriptor in getters / setters.
   *
   * @param  {String} name        The name of the descriptor.
   * @param  {Object} descriptor  The normalized descriptor.
   *
   * @return {Object} The wrapped descriptor.
   */
  wrapDescriptor: function (name, descriptor) {
    var value = descriptor.value,
        wrapped = {};
    each(descriptor, function (value, key) {
      if (key !== 'value' && key !== 'writable') {
        wrapped[key] = value;
      }
    });
    wrapped.get = function () {
      return this['[[state]]'][name];
    };
    if (wrapped.cast || wrapped.type) {
      var caster = wrapped.cast || Casting.get(wrapped.type);
      wrapped.set = function (value) {
        this['[[state]]'][name] = value === null ? null : caster.call(this, value);
      };
    }
    else {
      wrapped.set = function (value) {
        this['[[state]]'][name] = value;
      };
    }
    return wrapped;
  },
  /**
   * Create the default static methods / properties for a class.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   *
   * @return {Object} The default static descriptors.
   */
  createDefaultStatic: function (Class, descriptors, staticDescriptors) {
    var context = this.__super__.createDefaultStatic.call(this, Class, descriptors, staticDescriptors);
    context.cast = {
      enumerable: true,
      configurable: true,
      writable: true,
      value: this.createStaticCast(Class, descriptors, staticDescriptors)
    };
    context.validate = {
      enumerable: true,
      configurable: true,
      writable: true,
      value: this.createStaticValidate(Class, descriptors, staticDescriptors)
    };
    context.input = {
      enumerable: true,
      configurable: true,
      writable: true,
      value: this.createStaticInput(Class, descriptors, staticDescriptors)
    };
    context.toJSON = {
      enumerable: true,
      configurable: true,
      writable: true,
      value: this.createStaticToJSON(Class, descriptors, staticDescriptors)
    };
    return context;
  },
  /**
   * Create a function which can cast objects to this class.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   *
   * @return {Function} The generated function.
   */
  createStaticCast: function (Class, descriptors, staticDescriptors) {
    var castAll = Casting.forDescriptors(descriptors);
    function cast (value) {
      if (!(value instanceof this)) {
       return new this(value);
      }
      else {
        return castAll(value);
      }
    }

    cast.isAutoGenerated = true;
    return cast;
  },
  /**
   * Create a function which validate instances of the class.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   *
   * @return {Function} The generated function.
   */
  createStaticValidate: function (Class, descriptors, staticDescriptors) {
    var validate = Validating.forDescriptors(descriptors);
    validate.isAutoGenerated = true;
    return validate;
  },
  /**
   * Create a function which can accept user input for the model.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   *
   * @return {Function} The generated function.
   */
  createStaticInput: function (Class, descriptors, staticDescriptors) {
    var casters = {},
        validators = {},
        body = '"use strict";\n\
                var valid = true,\n\
                    errors = {},\n\
                    result;\n\
                if (values === undefined) {\n\
                  values = subject || {};\n\
                  subject = new this();\n\
                }\n';

    each(descriptors, function (descriptor, key) {
      if (key === '[[state]]' ||
          key === 'initialize' ||
          (!descriptor.writable && typeof descriptor.set !== 'function') ||
          typeof descriptor.value === 'function'
      ) {
        return;
      }

      var accessor = createAccessor(key);
      body += 'if (values'+accessor+' !== undefined) {\n';
      if (descriptor.type) {
        casters[key] = Casting.get(descriptor.type);
        body += 'if (values'+accessor+' === null) {\n\
                   subject'+accessor+' = null;\n\
                 }\n\
                 else {\n\
                  result = tryCatch(casters'+accessor+', values'+accessor+');\n\
                  if (result.error) {\n\
                    valid = false;\n\
                    errors'+accessor+' = result.error.message;\n\
                  }\n\
                  else {\n\
                    subject'+accessor+' = result.value;\n\
                  }\n\
                }\n';
      }
      else {
        body += 'subject'+accessor+' = values'+accessor+';\n';
      }
      body += '}\n';
      if (descriptor.rules) {
        validators[key] = Validating.forDescriptor(key, descriptor);
        body += 'if (!errors'+accessor+') {\n\
                  result = validators'+accessor+'(subject'+accessor+');\n\
                  if (!result.valid) {\n\
                    valid = false;\n\
                    errors'+accessor+' = result.error;\n\
                  }\n\
                }\n';
      }
    });

    body += 'return {\n\
              valid: valid,\n\
              value: subject,\n\
              errors: errors\n\
            };';

    var input = this.createDynamicFunction('validators', 'casters', 'tryCatch', 'subject', 'values', body);

    var fn = function (subject, values) {
      return input.call(this, validators, casters, tryCatch1, subject, values);
    };
    fn.isAutoGenerated = true;
    return fn;
  },
  /**
   * Create a function which can return a representation
   * of the **class**, whichcan be encoded as JSON.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   *
   * @return {Function} The generated function.
   */
  createStaticToJSON: function (Class, descriptors, staticDescriptors) {
    var properties = {};
    each(descriptors, function (descriptor, name) {
      var property = {};
      properties[name] = property;
      each(descriptor, function (value, key) {
        if (key === 'rules') {
          property.rules = value.map(function (item) {
            var name;
            if (Array.isArray(item)) {
              name = item[0];
              item = item[1] || {};
              item.name = name;
              return item;
            }
            else {
              return item;
            }
          });
        }
        else if (!isBuiltinDescriptorKey(key)) {
          property[key] = value;
        }
      });
    });
    var toJSON = function () {
      return {
        '@context': this['@context'],
        '@id': this['@id'],
        '@type': this['@type'],
        name: this.name,
        properties: properties
      };
    };

    toJSON.isAutoGenerated = true;
    return toJSON;
  },
  /**
   * Update the dynamic auto-generated functions for a class.
   *
   * @param  {Function} Class             The class.
   * @param  {Object}   descriptors       The property descriptors.
   * @param  {Object}   staticDescriptors The static property descriptors.
   */
  updateDynamicFunctions: function (Class, descriptors) {
    this.__super__.updateDynamicFunctions.call(this, Class, descriptors);
    if (!Class.prototype.forEach || Class.prototype.forEach.isAutoGenerated) {
      Class.prototype.forEach = this.createForEach(Class, descriptors);
    }
    if (!Class.prototype.keys || Class.prototype.keys.isAutoGenerated) {
      Class.prototype.keys = this.createKeys(Class, descriptors);
    }
    if (!Class.cast || Class.cast.isAutoGenerated) {
      Class.cast = this.createStaticCast(Class, descriptors);
    }
    if (!Class.validate || Class.validate.isAutoGenerated) {
      Class.validate = this.createStaticValidate(Class, descriptors);
    }
    if (!Class.input || Class.input.isAutoGenerated) {
      Class.input = this.createStaticInput(Class, descriptors);
    }
    if (!Class.toJSON || Class.toJSON.isAutoGenerated) {
      Class.toJSON = this.createStaticToJSON(Class, descriptors);
    }
  }
});


function each (obj, visitor) {
  var keys = Object.keys(obj),
      length = keys.length,
      key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    visitor(obj[key], key, obj);
  }
}

var safeIdentifier = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

function createAccessor (name) {
  if (safeIdentifier.test(name)) {
    return '.' + name;
  }
  else {
    return '[' + JSON.stringify(name) + ']';
  }
}

// try..catch causes deoptimisation in V8 and most
// other JS engines. Using a specialist function minimises the impact.

function tryCatch1 (fn, arg1) {
  var errorObject = {};
  try {
    errorObject.value = fn(arg1);
  }
  catch (e) {
    errorObject.error = e;
  }
  return errorObject;
}

function isBuiltinDescriptorKey (key) {
  switch (key) {
    case 'enumerable':
    case 'configurable':
    case 'writable':
    case 'get':
    case 'set':
    case 'value':
      return true;
    default:
      return false;
  }
}