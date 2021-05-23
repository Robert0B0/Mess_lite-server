const usersResolvers = require("./users");
const messagesResolvers = require("./messages");

const Message = require("../../models/Message");
const User = require("../../models/User");
const Reaction = require("../../models/Reaction");

module.exports = {
	Reaction: {
		Message: async (parent) => await Message.findById(parent.messageId),
		User: async (parent) =>
			await User.findById(parent.userId, {
				attributes: ["username", "imageUrl", "createdAt"],
			}),
	},

	Query: {
		...usersResolvers.Query,
		...messagesResolvers.Query,
	},
	Mutation: {
		...usersResolvers.Mutation,
		...messagesResolvers.Mutation,
	},
	Subscription: {
		...messagesResolvers.Subscription,
	},
};
