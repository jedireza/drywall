```
    ____                            ____    _     
   / __ \_______  ___      ______ _/ / /   (_)____
  / / / / ___/ / / / | /| / / __ `/ / /   / / ___/
 / /_/ / /  / /_/ /| |/ |/ / /_/ / / /   / (__  ) 
/_____/_/   \__, / |__/|__/\__,_/_/_(_)_/ /____/  
           /____/                    /___/        
```

Drywall.js
=============

A website and user system for Node.js. What you create with Drywall is more important than Drywall.

[See a bird's eye view.](http://jedireza.github.io/drywall/)

Technology
------------

Server = [express, jade, passport, mongoose, emailjs, async]

Client = [bootstrap, backbone.js, jquery]

Test Drive
------------

https://drywall.herokuapp.com/

 - username: root
 - password: h3r00t

https://drywall.nodejitsu.com/

 - username: root
 - password: j1ts00t

Note: The apps on Heroku and Nodejitsu have been modified so you cannot change the root user, the root user's linked administrator role or the root admin group. This was done in order to keep the app ready to test at all times.

Installation
------------

 1. Clone the repository (or download/unzip) into a directory.
 2. Run `$ npm install`
 3. Configure `/app.js` with mongodb and email credentials.
 4. Run app via `$ ./run.js`

Setup
------------

You need a few records in the database to start using the user system.

Run these commands on mongo. __Obviously you should use your email address.__

```js
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
 - Write code in a simple and consistant way.
 - No home-grown modules or libraries.
 - Only create minor utilities or plugins to avoid repetitiveness.
 - Find and use good tools; frameworks, modules and libraries.
 - Use tools in their native/default behavior.

Features
------------

 - Basic front end web pages.
 - Contact page has form to email.
 - Login system with forgot password and reset password.
 - Signup and Login with Facebook, Twitter and GitHub
 - User system with seperate account and admin roles.
 - Admin groups with shared permission settings.
 - Administrator level permissions which override group permissions.
 - Global admin quick search component.

License
------------

MIT

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/d41f60f22a2148e2e2dc6b705cd01481 "githalytics.com")](http://githalytics.com/jedireza/drywall)