const db = require("../../data/dbConfig");

const validateBody = async (req, res, next) => {
	let { username, password } = req.body;

	// 3- On FAILED registration due to `username` or `password` missing from the request body,
	// the response body should include a string exactly as follows: "username and password required".
	if (!username || !password) {
		res.status(400).json({ message: "username and password required" });
		return;
	}

	next();
};

const usernameTaken = async (req, res, next) => {
	// 4- On FAILED registration due to the `username` being taken,
	// the response body should include a string exactly as follows: "username taken".
	const user = await db("users").where({ username: req.body.username }).first();

	if (user) {
		res.status(400).json({ message: "username taken" });
		return;
	}

	next();
};

const userExists = async (req, res, next) => {
	const user = await db("users").where({ username: req.body.username }).first();

	if (user) {
		req.user = user;
		next();
	} else {
		// 4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
		//   the response body should include a string exactly as follows: "invalid credentials".
		res.status(400).json({
			message: "invalid credentials",
		});
	}
};

module.exports = {
	usernameTaken,
	validateBody,
	userExists,
};
