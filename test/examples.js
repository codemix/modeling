var expect = require('expect.js');
var Modeling = require('../lib');

describe('Examples', function () {
  var Thing = Modeling("Thing", {
    name: {
      label: 'Name',
      description: 'The name of the item',
      type: 'string',
      rules: [
        ['required']
      ]
    },
    description: {
      label: 'Description',
      description: 'A short description of the item.',
      type: 'string',
      rules: [
        {name: 'length', max: 255}
      ]
    },
    url: {
      label: 'URL',
      description: 'A URL identifiying the item.',
      type: 'string',
      rules: [
        ['url']
      ]
    }
  });

  var Person = Thing.extend("Person", {
    dateOfBirth: {
      label: 'Date of Birth',
      description: "The person's date of birth.",
      type: Date,
      rules: [
        ['date']
      ]
    },
    age: {
      label: 'Age',
      description: "The person's age.",
      type: Number,
      enumerable: true,
      get: function () {
        var birthday = this.dateOfBirth;
        if (!birthday) {
          return;
        }
        var ageDifMs = Date.now() - birthday.getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getFullYear() - 1970);
      }
    }
  });

  it('should calculate ages correctly', function () {
    var person = new Person({
      name: 'Bob',
      url: 'http://example.com/',
      dateOfBirth: '2000-01-01'
    });
    person.age.should.equal(new Date().getFullYear() - 2000);
  });

  it('should not accept invalid property values', function () {
    var person = new Person();
    person.name = 'Bob';
    person.configure({url: 'not a url'});
    expect(function () {person.dateOfBirth = 'not a date';}).to.throwError(TypeError);
    Person.validate(person).valid.should.be.false;
  });
});