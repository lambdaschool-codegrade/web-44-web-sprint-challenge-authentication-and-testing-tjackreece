const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();

const db = require("../../data/dbConfig");

const {
	validateBody,
	usernameTaken,
	userExists,
} = require("./auth-middleware");

/*
IMPLEMENT [POST] /api/auth/register
You are welcome to build additional middlewares to help with the endpoint's functionality.
DO NOT EXCEED 2^8 ROUNDS OF HASHING!
*/
router.post("/register", validateBody, usernameTaken, async (req, res) => {
	// 1- In order to register a new account the client must provide `username` and `password`:
	// {
	//   "username": "Captain Marvel", // must not exist already in the `users` table
	//   "password": "foobar"          // needs to be hashed before it's saved
	let user = req.body;

	// 2- On SUCCESSFUL registration,
	// the response body should have `id`, `username` and `password`:
	// {
	//   "id": 1,
	//   "username": "Captain Marvel",
	//   "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
	// }
	const hash = bcrypt.hashSync(user.password, 8);
	user.password = hash;

	db("users")
		.insert(user)
		.then(([id]) => {
			return db("users").where({ id });
		})
		.then(([user]) => {
			res.status(201).json(user);
		})
		.catch((err) => {
			res
				.status(500)
				.json({ error: err, message: "Something happened with the server" });
		});
});

/*
  IMPLEMENT [POST] /api/auth/login
  You are welcome to build additional middlewares to help with the endpoint's functionality.
*/
router.post("/login", validateBody, userExists, (req, res) => {
	// 1- In order to log into an existing account the client must provide `username` and `password`:
	//   {
	//     "username": "Captain Marvel",
	//     "password": "foobar"
	//   }
	let { username, password } = req.body;
	let user = req.user; //from middleware

	if (bcrypt.compareSync(password, user.password)) {
		const token = makeToken(user); //implemented below

		// 2- On SUCCESSFUL login,
		// the response body should have `message` and `token`:
		// {
		//   "message": "welcome, Captain Marvel",
		//   "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
		// }
		res.status(200).json({
			message: `welcome, ${username}`,
			token,
		});
	} else {
		// 4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
		//   the response body should include a string exactly as follows: "invalid credentials".
		res.status(401).json({ message: "invalid credentials" });
	}
});

function makeToken(user) {
	const payload = {
		subject: user.id,
		username: user.username,
		role: user.role,
	};
	const options = {
		expiresIn: "500s",
	};
	return jwt.sign(payload, "keep it secret", options);
}

module.exports = router;
