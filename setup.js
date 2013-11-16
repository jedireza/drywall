var mongoose = require('mongoose'),
	config = require('./config'),
    prompt = require('prompt'),
    Q = require('q');

var getStub = { };
getStub['env'] = 'development';
getStub['crypto-key'] = config.cryptoKey;

var app = {
    db: mongoose.createConnection(config.mongodb.uri),
    get: function (val) {
        if (!getStub[val]) throw new Error('unknown value: ' + val);
        return getStub[val];
    }
};
require('./models')(app, mongoose);

app.db.on('error', function (err) {
	console.error(err.stack);
	process.exit();
});

var schema = {
    properties: {
  user: {
    description: 'Enter a username for the root user',
    pattern: /^[a-zA-Z0-9\-\_]+$/,
    message: 'Name must contain only letters, numbers, dash, or underscore',
    required: true
  },
  firstname: {
    description: 'Enter a first name',
    required: true
  },
  lastname: {
    description: 'Enter a last name',
    required: true
  },
  email: {
    description: 'Enter an e-mail address',
    pattern: /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/,
    message: 'Must enter a valid e-mail address',
    required: true
  },
  password: {
    description: 'Enter a password',
    hidden: true,
    required: true
  },
  verify: {
    description: 'Verify your password',
    hidden: true,
    required: true
  }
  }
};

//
// Start the prompt
//
function getInfo() {
    prompt.start();
    prompt.get(schema, function (err, result) {
        if (result.password !== result.verify) {
            console.log('Passwords don\'t match, please try again');
            process.nextTick(getInfo);
            return;
        }
        createRootUser(result);
    });
}
getInfo();

function createRootUser(values) {
    Q.all(
        Q.ninvoke(app.db.models.AdminGroup, 'create', {
            _id: 'root',
            name: 'Root'
        }),
        Q.ninvoke(app.db.models.Admin, 'create', {
            name: { first: values.firstname, last: values.lastname, full: values.firstname + ' ' + values.lastname },
            groups: ['root']
        })
    ).then(function () {
        return Q.ninvoke(app.db.models.Admin, 'findOne').then(function (rootAdmin) {
            return Q.ninvoke(app.db.models.User, 'create', {
                username: values.user,
                isActive: 'yes',
                email: values.email,
                password: app.db.models.User.encryptPassword(values.password),
                search: [ values.user, values.email ],
                roles: {admin: rootAdmin._id}
            }).then(function (res) {
                Q.ninvoke(app.db.models.User, 'findOne').then(function (rootUser) {
                    rootAdmin.user = { id: rootUser._id, name: rootUser.username };
                    rootAdmin.save();
                })
            });
        });
    }).then(function () {
        console.log('done');
        app.db.close();
    }).fail(function (err) {
        console.log('error: ', err);
    });
}