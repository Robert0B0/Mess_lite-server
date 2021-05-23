const {
	UserInputError,
	AuthenticationError,
	ForbiddenError,
	withFilter,
} = require("apollo-server");
const checkAuth = require("../../util/check-auth");
const Message = require("../../models/Message");
const User = require("../../models/User");
const Reaction = require("../../models/Reaction");
const { PubSub } = require("apollo-server");

const pubsub = new PubSub();

module.exports = {
	Query: {
		getMessages: async (parent, { from }, { user }) => {
			/* const user = checkAuth(context); */
			try {
				if (!user) throw new AuthenticationError("Unauthenticated");

				const otherUser = await User.findOne({ username: from });
				if (!otherUser) {
					throw new UserInputError("User not found");
				}

				const usernames = [user.username, otherUser.username];
				const messages = await Message.find({
					$or: [
						{ from: usernames, to: usernames },
						{ from: usernames, to: usernames },
					],
				}).sort({ createdAt: -1 });

				return messages;
			} catch (err) {
				throw err;
			}
		},
	},
	Mutation: {
		sendMessage: async (parent, { to, content }, { user, pubsub }) => {
			/* const user = checkAuth(context); */

			try {
				if (!user) throw new AuthenticationError("Unauthenticated");
				const recipient = await User.findOne({ username: to });

				if (!recipient) {
					throw new UserInputError("User not found");
				} else if (recipient.username === user.username) {
					throw new UserInputError("You cant message yourself");
				}

				if (content.trim() === "") {
					throw new UserInputError("Message is empty");
				}

				const newMessage = await new Message({
					from: user.username,
					to,
					content,
					createdAt: new Date().toISOString(),
				});

				const message = await newMessage.save();
				pubsub.publish("NEW_MESSAGE", { newMessage: message });

				return message;
			} catch (err) {
				throw err;
			}
		},
		deleteMessage: async (parent, { id }, { user }) => {
			try {
				const message = await Message.findById(id);
				if (!message) {
					throw new UserInputError("Message not found");
				} else {
					await message.delete();
					return "Message deleted successfully";
				}
			} catch (err) {
				throw err;
			}
		},
		editMessage: async (parent, { id, content }, { user }) => {
			try {
				const message = await Message.findById(id);
				if (!message) {
					throw new UserInputError("Message not found");
				} else if (content.trim() === "") {
					throw new Error("Message can not be empty");
				} else {
					message.content = content;
					await message.save();
					return message;
				}
			} catch (err) {
				throw err;
			}
		},
		reactToMessage: async (_, { id, content }, { user }) => {
			const reactions = ["❤️", "😆", "😯", "😢", "😡", "👍", "👎"];
			try {
				if (!reactions.includes(content)) {
					throw new UserInputError("Invalid reaction");
				}

				const username = user ? user.username : "";
				user = User.findOne({ username: username });
				if (!user) throw new AuthenticationError("Unauthenticated");

				const message = Message.findOne({ id: id });
				if (!message) throw new UserInputError("message not found");

				if (message.from !== user.username && message.to !== user.username) {
					throw new ForbiddenError("Unauhtorized");
				}

				let reaction = await Reaction.findOne({
					messageId: message.id,
					userId: user.id,
				});
				if (reaction) {
					reaction.content = content;
					await reaction.save();
				} else {
					reaction = await new Reaction({
						messageId: message.id,
						userId: user.id,
						createdAt: new Date().toISOString(),
						content,
					});
				}
				pubsub.publish("NEW_REACTION", { newReaction: reaction });

				return reaction;
			} catch (err) {
				throw err;
			}
		},
	},
	Subscription: {
		newMessage: {
			subscribe: withFilter(
				(_, __, { user, pubsub }) => {
					if (!user) throw new AuthenticationError("Unauthenticated");
					return pubsub.asyncIterator("NEW_MESSAGE");
				},
				({ newMessage }, _, { user }) => {
					if (
						newMessage.from === user.username ||
						newMessage.to === user.username
					) {
						return true;
					}
					return false;
				}
			),
		},
		newReaction: {
			subscribe: withFilter(
				(_, __, { user, pubsub }) => {
					if (!user) throw new AuthenticationError("Unauthenticated");
					return pubsub.asyncIterator("NEW_REACTION");
				},
				({ newReaction }, _, { user }) => {
					if (
						newReaction.from === user.username ||
						newReaction.to === user.username
					) {
						return true;
					}
					return false;
				}
			),
		},
	},
};
