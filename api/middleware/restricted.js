const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const token = req.headers.authorization;
	/*
    IMPLEMENT
    1- On valid token in the Authorization header, call next.
  */
	if (token) {
		jwt.verify(token, "keep it secret", (err, decoded) => {
			if (!err) {
				req.decodedToken = decoded;
				next();
				return;
			}
			/*
    3- On invalid or expired token in the Authorization header,
      the response body should include a string exactly as follows: "token invalid".
  */
			res.status(401).json({ message: "token invalid" });
			return;
		});
		return;
	}

	/*
    2- On missing token in the Authorization header,
      the response body should include a string exactly as follows: "token required".
  */
	res.status(401).json({ message: "token required" });
};
