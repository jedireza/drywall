exports = module.exports = function(app, mongoose) {
  var noteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    data: String,
    timeCreated: { type: Date, default: Date.now }
  });
  app.db.model('Note', noteSchema);
}