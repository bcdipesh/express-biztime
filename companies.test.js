/** Tests for Company routes */

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app");
const db = require("./db");

const notFound = {
  error: {
    message: "Not Found",
    status: 404,
  },
  message: "Not Found",
};

/** After all tests, close the database connection */
afterAll(() => {
  db.end();
});

/** GET /companies */
describe("GET /companies", () => {
  test("Returns an array of companies", async () => {
    const resp = await request(app).get("/companies");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      companies: [
        {
          code: "apple",
          name: "Apple Computer",
          description: "Maker of OSX.",
        },
        {
          code: "ibm",
          name: "IBM",
          description: "Big blue.",
        },
      ],
    });
  });
});

/** GET /companies/:code */
describe("GET /companies/:code", () => {
  test("Returns a specific company", async () => {
    const resp = await request(app).get("/companies/ibm");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: "ibm",
        name: "IBM",
        description: "Big blue.",
      },
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/companies/li");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});

/** POST /companies */
describe("POST /companies", () => {
  /** Delete the newly created company after testing is done */
  afterAll(async () => {
    await db.query("DELETE FROM companies WHERE code = 'lorem-ipsum';");
  });

  test("Adds and returns the newly created company", async () => {
    const name = "Lorem Ipsum";
    const description = "Lorem Ipsum Dolor Init";

    const resp = await request(app)
      .post("/companies")
      .send({ name, description });

    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      company: { code: "lorem-ipsum", name, description },
    });
  });
});

/** PUT /companies/:code */
describe("PUT /companies/:code", () => {
  /** Reset data after test. */
  afterAll(async () => {
    await db.query(
      "UPDATE companies SET description = 'Big blue.' WHERE code = 'ibm';"
    );
  });

  test("Updates existing company and returns it", async () => {
    const resp = await request(app).put("/companies/ibm").send({
      description: "Big Blue Company.",
    });

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: "ibm",
        name: "IBM",
        description: "Big Blue Company.",
      },
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/companies/li");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});

/** DELETE /companies/:code */
describe("DELETE /companies/:code", () => {
  /** Create a dummy company */
  beforeAll(async () => {
    await db.query(
      "INSERT INTO companies (code, name, description) VALUES ('li', 'Lorem Ipsum', 'Lorem Ipsum Dolor Init');"
    );
  });

  test("Deletes company", async () => {
    const resp = await request(app).delete("/companies/li");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      status: "deleted",
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/companies/li");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});
