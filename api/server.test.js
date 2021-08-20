const request = require("supertest");
const db = require("../data/dbConfig.js");
const server = require("./server.js");

const carol = {
	username: "Captain Marvel",
	password: "foobar",
};

const dad_joke = {
	id: "0189hNRf2g",
	joke:
		"I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later.",
};

test("sanity", () => {
	expect(true).not.toBe(false);
	//I saw what you did there
});

beforeAll(async () => {
	await db.migrate.rollback();
	await db.migrate.latest();
});

beforeEach(async () => {
	await db("users").truncate();
});
afterAll(async () => {
	await db.destroy(); // disconnects db
});

describe("server", () => {
	describe("[POST] /api/auth/register", () => {
		test("user can register", async () => {
			let res;
			res = await request(server).post("/api/auth/register").send(carol);
			expect(res.status).toBe(201);
		});
		it("adds the user to the database", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await db("users").where({ id: 1 }).first();
			expect(res.username).toBe(carol.username);
		});
		it("rejects username if taken", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);

			res = await request(server).post("/api/auth/register").send(carol);
			expect(res.status).toBe(400);
			expect(res.text).toMatch(/.*username taken.*/);
		});
		it("requires username and password", async () => {
			let res;
			res = await request(server)
				.post("/api/auth/register")
				.send({ password: "foobar" });
			expect(res.text).toMatch(/.*username and password required.*/);

			res = await request(server)
				.post("/api/auth/register")
				.send({ username: "Captain Marvel" });
			expect(res.text).toMatch(/.*username and password required.*/);
		});
	});
	describe("[POST] /api/auth/login", () => {
		it("requires username and password", async () => {
			let res;
			res = await request(server)
				.post("/api/auth/login")
				.send({ password: "foobar" });
			expect(res.text).toMatch(/.*username and password required.*/);

			res = await request(server)
				.post("/api/auth/login")
				.send({ username: "Captain Marvel" });
			expect(res.text).toMatch(/.*username and password required.*/);
		});
		it("checks if username exists", async () => {
			let res;
			res = await request(server).post("/api/auth/login").send(carol);
			expect(res.text).toMatch(/.*invalid credentials.*/);
		});
		it("checks if password is correct", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await request(server)
				.post("/api/auth/login")
				.send({ ...carol, password: "bad_password" });
			expect(res.text).toMatch(/.*invalid credentials.*/);
		});
		it("logs in with valid credentials", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await request(server).post("/api/auth/login").send(carol);
			expect(res.text).toMatch(/.*welcome.*token.*/);
		});
	});
	describe("[GET] /api/jokes", () => {
		it("is restricted by middleware", async () => {
			const res = await request(server).get("/api/jokes");
			expect(res.status).toBe(401);
			expect(res.text).toMatch(/.*token required.*/i);
		});
		it("allows access after login", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await request(server).post("/api/auth/login").send(carol);

			let { token } = res.body;

			res = await request(server).get("/api/jokes").set("Authorization", token);
			expect(res.status).toBe(200);
		});
		it("serves correct number of jokes", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await request(server).post("/api/auth/login").send(carol);
			res = await request(server)
				.get("/api/jokes")
				.set("Authorization", res.body.token);
			expect(res.body).toHaveLength(3);
		});
		it("serves correctly formatted jokes", async () => {
			let res;
			await request(server).post("/api/auth/register").send(carol);
			res = await request(server).post("/api/auth/login").send(carol);
			res = await request(server)
				.get("/api/jokes")
				.set("Authorization", res.body.token);
			expect(res.body[0]).toEqual(dad_joke);
		});
	});
});
