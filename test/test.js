var Modeling = require('../lib');

describe('Modeling', function () {

  var Thing = Modeling({
    '@id': {
      label: 'ID',
      description: 'The unique ID of the thing.',
      type: Number,
      default: null,
      rules: [{name: "number", allowEmpty: true}]
    },
    noType: {
      default: null
    }
  });

  var User = Modeling({
    name: {
      label: 'Name',
      description: 'The name of the user.',
      type: 'string',
      rules: [
        ["required"],
        ["regexp", {pattern: /^([A-Za-z][A-Za-z0-9-]*)$/}],
      ]
    },
    email: {
      label: 'Email',
      description: 'The user\'s email address.',
      type: 'string',
      rules: [
        {name: 'email'}
      ]
    }
  });

  User.inherits(Thing);

  describe('cast()', function () {
    var user = User.cast({
      name: 123,
      email: true
    });
    it('should cast objects to the right class', function () {
      user.should.be.instanceOf(User);
    });
    it('should cast properties to the right type', function () {
      user.name.should.equal('123');
      user.email.should.equal('true');
    });
  });

  describe('inherits()', function () {
    beforeEach(function () {
      this.user = new User({
        '@id': 'not a number',
        name: 'admin',
        email: true
      });
    });
    it('should inherit the parent class corretly', function () {
      this.user.should.be.instanceOf(User);
      this.user.should.be.instanceOf(Thing);
    });
    it('should inherit descriptors properly', function () {
      var result = User.validate(this.user);
      result.valid.should.be.false;
      result.errors.should.eql({
        '@id': 'Expected a number.',
        email: 'Not a valid email address.'
      });
    });
  });

  describe('integration', function () {
    beforeEach(function () {
      this.user = new User({
        name: 123,
        email: true
      });
    });
    it('should cast property values', function () {
      this.user.name.should.equal('123');
      this.user.email.should.equal('true');
    });

    it('should have only the defined keys', function () {
      Object.keys(this.user).should.eql(['@id', 'noType', 'name', 'email']);
    });

    it('should validate invalid objects', function () {
      this.user.name = 'admin';
      this.user.email = 'nope';
      var result = User.validate(this.user);
      result.valid.should.be.false;
      result.errors.should.eql({
        email: 'Not a valid email address.'
      });
    });

    it('should validate invalid objects with multiple errors', function () {
      var result = User.validate(this.user);
      result.valid.should.be.false;
      result.errors.should.eql({
        name: 'Does not match the required pattern.',
        email: 'Not a valid email address.'
      });
    });

    it('should validate valid objects', function () {
      this.user.name = 'admin';
      this.user.email = 'test@example.com';
      result = User.validate(this.user);
      result.valid.should.be.true;
      result.errors.should.eql({});
    });
  });
});