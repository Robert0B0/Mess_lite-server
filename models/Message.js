const { model, Schema } = require("mongoose");

const MessageSchema = new Schema({
	content: String,
	from: String,
	to: String,
	createdAt: String,
});

module.exports = model("Message", MessageSchema);
