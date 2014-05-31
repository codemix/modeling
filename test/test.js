var Modely = require('../modely');

describe('Modely', function () {


  var User = Modely({
    name: {
      label: 'Name',
      description: 'The name of the user.',
      type: 'string',
      rules: [
        ["required"],
        ["pattern", /^([A-Za-z][A-Za-z0-9-]*)$/],
      ]
    },
    email: {
      label: 'Email',
      description: 'The user\'s email address.',
      type: 'string',
      rules: [

      ]
    }
  });

  it('should create model classes', function () {
    var user = new User({
      name: 'Bob',
      email: 'bob@example.com'
    });

    user.validate.should.be.type('function');
    console.log(user.validate());
  });
});