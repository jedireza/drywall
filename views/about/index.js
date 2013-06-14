exports.init = function(req, res) {
  res.render('about/index', { user: req.user });
};