Drywall
=============

A website and user system for Node.js. What you create with Drywall is more important than Drywall. [See a bird's eye view.](http://jedireza.github.io/drywall/)

[![Dependency Status](https://david-dm.org/jedireza/drywall.png)](https://david-dm.org/jedireza/drywall)
[![devDependency Status](https://david-dm.org/jedireza/drywall/dev-status.png)](https://david-dm.org/jedireza/drywall#info=devDependencies)

Technology
------------

| On The Server | On The Client  | Development |
| ------------- | -------------- | ----------- |
| Express       | Bootstrap      | Grunt       |
| Jade          | Backbone.js    |             |
| Mongoose      | jQuery         |             |
| Passport      | Underscore.js  |             |
| Async         | Font-Awesome   |             |
| EmailJS       | Moment.js      |             |

Live Demos
------------

| Platform                       | Username | Password |
| ------------------------------ | -------- | -------- |
| https://drywall.herokuapp.com/ | root     | h3r00t   |
| https://drywall.nodejitsu.com/ | root     | j1ts00t  |
| https://drywall.onmodulus.net/ | root     | m0dr00t  |

__Note:__ The live demos have been modified so you cannot change the root user, the root user's linked Administrator role or the root Admin Group. This was done in order to keep the app ready to test at all times.

Requirements
------------

You need [Node.js](http://nodejs.org/download/) and [MongoDB](http://www.mongodb.org/downloads) installed and running.

We use [Grunt](http://gruntjs.com/) as our task runner. Get the CLI (command line interface).

```bash
$ npm install -g grunt-cli
```

Git Installation
------------
Go into the folder where your project is located and type the following commands

```bash
$ git clone git@github.com:jedireza/drywall.git && cd ./drywall
$ npm install
$ mv config.example.js config.js
$ grunt
```

Setup
------------

You need to change some variables in the config.js file.

If you are using a remote database, change 'localhost/drywall' to the URL of your remote database.
```js
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/drywall'
};
```
Configure the following information according to your preferences. 
```js
exports.companyName = 'Acme, Inc.';
exports.projectName = 'Drywall';
/*systemEmail is the sender of transactional emails such as registration confirmation and password reset emails*/
exports.systemEmail = 'your@email.addy';
/*cryptoKey can be any strong, secure key*/
exports.cryptoKey = 'k3yb0ardc4t';
exports.requireAccountVerification = false;
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
    address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
  },
  credentials: {
    //Set email credentials for your systemAdmin account
    user: process.env.SMTP_USERNAME || 'your@email.addy',
    password: process.env.SMTP_PASSWORD || 'bl4rg!',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    ssl: true
  }
};
```

Next, you need a few records in the database to start using the user system.

Run these commands on mongo. __Obviously you should use your email address.__

```js
use drywall;
db.admingroups.insert({ _id: 'root', name: 'Root' });
db.admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] });
var rootAdmin = db.admins.findOne();
db.users.save({ username: 'root', isActive: 'yes', email: 'your@email.addy', roles: {admin: rootAdmin._id} });
var rootUser = db.users.findOne();
rootAdmin.user = { id: rootUser._id, name: rootUser.username };
db.admins.save(rootAdmin);
```

Now just use the reset password feature to set a password.

 - `http://localhost:3000/login/forgot/`
 - Submit your email address and wait a second.
 - Go check your email and get the reset link.
 - `http://localhost:3000/login/reset/:token/`
 - Set a new password.

Login. Customize. Enjoy.

Philosophy
------------

 - Create a website and user system.
 - Write code in a simple and consistent way.
 - Only create minor utilities or plugins to avoid repetitiveness.
 - Find and use good tools.
 - Use tools in their native/default behavior.

Features
------------

 - Basic front end web pages.
 - Contact page has form to email.
 - Login system with forgot password and reset password.
 - Signup and Login with Facebook, Twitter and GitHub.
 - Optional email verification during signup flow.
 - User system with separate account and admin roles.
 - Admin groups with shared permission settings.
 - Administrator level permissions that override group permissions.
 - Global admin quick search component.

License
------------

MIT

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/d41f60f22a2148e2e2dc6b705cd01481 "githalytics.com")](http://githalytics.com/jedireza/drywall)