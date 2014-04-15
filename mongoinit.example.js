// Usage:
//   1. Create a copy of this script called 'mongoinit.js'
//   2. Edit the configuration section
//   3. Invoke the mongo shell using:
//        mongo <server>[:<port>]/admin mongoinit.js -u <serveradminuser> -p


// ======== CONFIGURATION SECTION ========
var dbName = 'drywall';
var rootAdminEmail = 'your@email.addy';

var rootAdminUserName = 'root';
var rootAdminGroupName = 'Root';
var rootAdminFirstName = 'Root'; var rootAdminLastName = 'Admin';

var productionAppUserName = 'drywallApp';
var productionAppPassword = 'secretpassword';
// ======== END CONFIGURATION SECTION ========


print("Initializing database '" + dbName + "'");

db = db.getSiblingDB(dbName);
db.admingroups.insert({ _id: rootAdminGroupName.toLowerCase(), name: rootAdminGroupName });
db.admins.insert({ name: {
    first: rootAdminFirstName,
    last: rootAdminLastName,
    full: rootAdminFirstName + ' ' + rootAdminLastName},
    groups: [rootAdminGroupName.toLowerCase()] });
var rootAdmin = db.admins.findOne();
db.users.save({ username: rootAdminUserName, isActive: 'yes', email: rootAdminEmail, roles: {admin: rootAdmin._id} });
var rootUser = db.users.findOne();
rootAdmin.user = { id: rootUser._id, name: rootUser.username };
db.admins.save(rootAdmin);

print("Adding app user");
db.addUser({user: productionAppUserName, pwd: productionAppPassword, roles: ["readWrite"]});

print("Drywall database created successfully.");
print("Use connection URI: 'mongodb://" + productionAppUserName + ':' + productionAppPassword + '@<server>[:<port>]/' + dbName + "'");
