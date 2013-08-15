// init drywall admin database
// run in mongo shell
// $ mongo load script.js
// main program

{
    var db = connect('localhost/drywall');
    var yourmail = 'your@email.addy'; // modify your mail here

    db.admingroups.insert({ _id: 'root', name: 'Root' });
    db.admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] });
    var rootAdmin = db.admins.findOne();
    db.users.save({ username: 'root', isActive: 'yes', email: yourmail, roles: {admin: rootAdmin._id} });
    var rootUser = db.users.findOne();
    rootAdmin.user = { id: rootUser._id, name: rootUser.username };
    db.admins.save(rootAdmin);

    print("Info: Init drywall admin db finished.");
}
