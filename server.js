const { ApolloServer } = require("apollo-server");
const mongoose = require("mongoose");

const { MONGODB } = require("./config");
const resolvers = require("./graphql/resolvers");
const typeDefs = require("./graphql/typeDefs");
const contextMiddleware = require("./util/contextMiddleware");

const PORT = process.env.PORT || 5000;

const server = new ApolloServer({
	typeDefs,
	resolvers,
	introspection: true,
	playground: true,
	context: contextMiddleware,
	/* context: ({ req }) => ({ req }), */
});

mongoose
	.connect(MONGODB, { useNewUrlParser: true })
	.then(() => {
		console.log("Connected to Database");
		return server.listen({ port: PORT });
	})
	.then((res) => {
		console.log(`server running at: ${res.url}`);
	})
	.catch((err) => console.error(err));
