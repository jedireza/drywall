var filterUser = function(user) {
    if ( user ) {
        return {
            user : {
                id: user._id,
                email: user.email,
                //firstName: user.firstName,
                //lastName: user.lastName,
                admin: !!(user.roles && user.roles.admin)
            }
        };
    } else {
        return { user: null };
    }
};

var security = {
    sendCurrentUser: function (req, res, next) {
        res.status(200).json(filterUser(req.user));
        res.end();
    }
};

module.exports = security;