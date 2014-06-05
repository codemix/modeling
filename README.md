# Modeling

[![Build Status](https://travis-ci.org/codemix/modeling.svg?branch=master)](https://travis-ci.org/codemix/modeling)


# Usage

```js
var Modeling = require('modeling');

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
    get: function () {
      var birthday = this.dateOfBirth;
      var ageDifMs = Date.now() - birthday.getTime();
      var ageDate = new Date(ageDifMs); // miliseconds from epoch
      return Math.abs(ageDate.getFullYear() - 1970);
    }
  }
});

```

# Installation

Via [npm](https://npmjs.org/package/modeling):

    npm install --save modeling


or [bower](http://bower.io/search/?q=modeling):


    bower install --save modeling



# Running the tests

First, `npm install`, then `npm test`. Code coverage generated with `npm run coverage`.


# License

MIT, see [LICENSE.md](LICENSE.md).

