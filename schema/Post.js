'use strict';

exports = module.exports = function(app, mongoose) {
  var postSchema = new mongoose.Schema({
  	_id: { type: String, default: '' },
  	title: { type: String, default: '' },
    content: { type: String, default: '' },
    pivot: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  postSchema.methods.linkToCategory = function(cat, done) {
  	var self = this;

  	app.db.models.Category.findOneAndUpdate(
  		{ name: cat }, 
  		{ $setOnInsert: { name: cat, pivot: cat } }, 
  		{ upsert: true , new: true}, 
  		function(err, result) {
	  		if(err) {
	  			done(err);
	  		}

	  		self.category = result.id;
	  		self.save(function(err){
	  			if(err) {
	  				done(err);
	  			}
	  			done(null, self);
	  		});
  	});
  };
  postSchema.plugin(require('./plugins/pagedFind'));
  postSchema.index({ pivot: 1 });
  postSchema.index({ title: 1 });
  postSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Post', postSchema);
};
