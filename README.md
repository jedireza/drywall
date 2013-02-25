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

A website and user system for Node.js. It's not the platform, not the framework and not a module.

What you create with Drywall is more important than Drywall.

Technologies Used
------------

Server = [node.js, express, jade, passport, mongoose, emailjs, async]

Client = [bootstrap, backbone.js, jquery]

Test Drive
------------

https://drywall.herokuapp.com/
 * username: root
 * password: h3r00t

Note: The app on Heroku has been modified so you cannot change the root user, the root users's linked administrator role or the root admin group. This was done in order to keep the app ready to test at all times.

Screen Shots & Video
------------

See the project page: http://jedireza.github.com/drywall/

Installation
------------

 1. Download and unzip (or git clone) into a directory.
 2. Run "$ npm install"
 3. Configure /app.js with mongodb and email credentials.
 4. Run app via "$ node app"

Setup
------------

You need a few records in the database to start using the user system.

Run these commands on mongo. *Obviously you should use your email address.

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

 * http://localhost:3000/login/forgot/
 * Submit your email address and wait a second.
 * Go check your email and get the reset link.
 * http://localhost:3000/login/reset/:token/
 * Set a new password.

Login. Customize. Enjoy.

Philosophy
------------

 * Create a website and user system.
 * Write code in a simple and consistant way.
 * No home-grown modules or libraries.
 * Only create minor utilities or plugins to avoid repetitiveness.
 * Find and use good tools; frameworks, modules and libraries.
 * Use tools in their native/default behavior.

Features
------------

 * Basic front end web pages.
 * Contact page has form to email.
 * Login system with forgot password and reset password.
 * User system with seperate account and admin roles.
 * Admin groups with shared permission settings.
 * Administrator level permissions which override group permissions.
 * Global admin quick search component.

License
------------

(The MIT License)

Copyright (c) 2012 Reza Akhavan <reza@akhavan.me>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/d41f60f22a2148e2e2dc6b705cd01481 "githalytics.com")](http://githalytics.com/jedireza/drywall)