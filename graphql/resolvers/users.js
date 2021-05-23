const bcrypt = require("bcryptjs");
const { UserInputError, AuthenticationError } = require("apollo-server");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../config");
const checkAuth = require("../../util/check-auth");
const User = require("../../models/User");
const Message = require("../../models/Message");
const {
	validateRegisterInput,
	validateLoginInput,
} = require("../../util/validators");

function generateToken(user) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			username: user.username,
			imageUrl: user.imageUrl,
		},
		JWT_SECRET,
		{ expiresIn: "2h" }
	);
}

module.exports = {
	Query: {
		async getUsers(_, __, { user }) {
			/* const user = checkAuth(context); */
			if (!user) {
				throw new AuthenticationError("Unauthenticated");
			}
			try {
				/* let users = await User.find({
					$nor: [{ username: user.username }],
				}); */
				let users = await User.find();

				const allUserMessages = await Message.find({
					$or: [{ from: user.username }, { to: user.username }],
				}).sort({ createdAt: -1 });

				users = users.map((otherUser) => {
					const latestMessage = allUserMessages.find(
						(m) => m.from === otherUser.username || m.to === otherUser.username
					);
					otherUser.latestMessage = latestMessage;

					return otherUser;
				});

				return users;
			} catch (err) {
				console.log(err);
			}
		},
	},
	Mutation: {
		async login(_, { username, password }) {
			const { errors, valid } = validateLoginInput(username, password);

			if (!valid) {
				throw new UserInputError("Errors", { errors });
			}

			const user = await User.findOne({ username });
			if (!user) {
				errors.username = "User not found";
				throw new UserInputError("User not found", { errors });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				errors.password = "Incorrect Password";
				throw new UserInputError("Incorrect Password", { errors });
			}

			const token = generateToken(user);

			return {
				...user._doc,
				id: user._id,
				token,
			};
		},
		async register(
			_,
			{
				registerInput: { username, email, password, confirmPassword, imageUrl },
			}
		) {
			//user data must be valid:
			const { valid, errors } = validateRegisterInput(
				username,
				email,
				password,
				confirmPassword,
				imageUrl
			);
			if (!valid) {
				throw new UserInputError("Errors", { errors });
			}
			//user must be unique
			const user = await User.findOne({ username });
			if (user) {
				throw new UserInputError("Username is taken", {
					errors: {
						username: "This username is taken",
					},
				});
			}
			//Hash password and create an auth. token
			password = await bcrypt.hash(password, 12);

			const newUser = new User({
				username,
				email,
				password,
				imageUrl,
				createdAt: new Date().toISOString(),
			});

			const res = await newUser.save();
			const token = generateToken(res);

			return {
				...res._doc,
				id: res._id,
				token,
			};
		},
	},
};
