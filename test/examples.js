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

  it('should reject invalid user input', function () {
    var result = Person.input({
      name: null,
      dateOfBirth: 'not a date'
    });
    result.valid.should.be.false;
    result.errors.should.have.properties(['name', 'dateOfBirth']);
  });

  it('should accept user input', function () {
    var result = Person.input({
      name: 'nom',
      dateOfBirth: '2013-10-01'
    });

    result.valid.should.be.true;
    result.value.should.be.instanceOf(Person);
    result.value.name.should.equal('nom');
    result.value.dateOfBirth.should.eql(new Date('2013-10-01'));
  });

  it('should apply input to an existing instance', function () {
    var person = new Person({
      name: 'Bob',
      url: 'http://example.com/',
      dateOfBirth: '2000-01-01'
    });
    person.age.should.equal(new Date().getFullYear() - 2000);
    var result = Person.input(person, {
      dateOfBirth: '1990-01-01'
    });
    result.valid.should.be.true;
    person.age.should.equal(new Date().getFullYear() - 1990);
  });
});