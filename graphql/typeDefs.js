const { gql } = require("apollo-server");

module.exports = gql`
	type User {
		id: ID!
		username: String!
		password: String!
		email: String
		createdAt: String!
		token: String!
		imageUrl: String
		latestMessage: Message
	}
	type Message {
		id: ID!
		from: String!
		to: String!
		content: String!
		createdAt: String!
	}
	type Reaction {
		id: String!
		content: String!
		createdAt: String!
		Message: Message!
		messageId: ID!
		User: User!
		userId: ID!
	}
	input RegisterInput {
		username: String!
		password: String!
		confirmPassword: String!
		email: String!
		imageUrl: String
	}
	type Query {
		getUsers: [User]!
		getMessages(from: String!): [Message]!
	}
	type Mutation {
		login(username: String!, password: String!): User!
		register(registerInput: RegisterInput): User!
		sendMessage(to: String!, content: String!): Message!
		editMessage(id: ID!, content: String!): Message!
		deleteMessage(id: ID!): String!
		reactToMessage(id: ID!, content: String!): Reaction!
	}
	type Subscription {
		newMessage: Message!
		newReaction: Reaction!
	}
`;
