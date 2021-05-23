const { model, Schema } = require("mongoose");

const ReactionSchema = new Schema({
	content: String,
	from: String,
	to: String,
	messageId: String,
	userId: String,
	createdAt: String,
});

module.exports = model("Reaction", ReactionSchema);
