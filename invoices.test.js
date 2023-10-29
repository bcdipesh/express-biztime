/** Tests for Invoice routes */

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

/** GET /invoices */
describe("GET /invoices", () => {
  test("Returns info on invoices", async () => {
    const resp = await request(app).get("/invoices");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      invoices: [
        {
          id: 1,
          comp_code: "apple",
          amt: 100,
          paid: false,
          add_date: expect.any(String),
          paid_date: null,
        },
        {
          id: 2,
          comp_code: "apple",
          amt: 200,
          paid: false,
          add_date: expect.any(String),
          paid_date: null,
        },
        {
          id: 3,
          comp_code: "apple",
          amt: 300,
          paid: true,
          add_date: expect.any(String),
          paid_date: expect.any(String),
        },
        {
          id: 4,
          comp_code: "ibm",
          amt: 400,
          paid: false,
          add_date: expect.any(String),
          paid_date: null,
        },
      ],
    });
  });
});

/** GET /invoices/:id */
describe("GET /invoices/:id", () => {
  test("Returns a single invoice based on the id", async () => {
    const resp = await request(app).get("/invoices/4");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      invoice: {
        id: "4",
        amt: 400,
        paid: false,
        add_date: "2023-10-29T04:00:00.000Z",
        paid_date: null,
        company: {
          code: "ibm",
          name: "IBM",
          description: "Big blue.",
        },
      },
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/invoices/10");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});

/** POST /invoices */
describe("POST /invoices", () => {
  let id = null;
  /** Delete the newly created invoice. */
  afterAll(async () => {
    await db.query("DELETE FROM invoices WHERE id = $1;", [id]);
  });

  test("Adds and returns the newly created invoice", async () => {
    const resp = await request(app).post("/invoices").send({
      comp_code: "ibm",
      amt: 500,
    });

    expect(resp.statusCode).toBe(201);
    expect(resp.body).toEqual({
      invoice: {
        id: expect.any(Number),
        comp_code: "ibm",
        amt: 500,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });

    id = resp.body.invoice.id;
  });
});

/** PUT /invoices/:id */
describe("PUT /invoices/:id", () => {
  /** Reset data after test is done */
  afterAll(
    async () => await db.query("UPDATE invoices SET amt = 400 WHERE id = 4;")
  );

  test("Updates an invoice and returns it", async () => {
    const resp = await request(app).put("/invoices/4").send({
      amt: 500,
    });

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      invoice: {
        id: 4,
        comp_code: "ibm",
        amt: 500,
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/invoices/10");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});

/** DELETE /invoices/:id */
describe("DELETE /invoices/:id", () => {
  /** Create a dummy invoice */
  let invoiceId = null;
  beforeAll(async () => {
    const newInvoice = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ('ibm', 500) RETURNING id;"
    );

    invoiceId = newInvoice.rows[0].id;
  });

  test("Deletes an invoice", async () => {
    const resp = await request(app).delete(`/invoices/${invoiceId}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/invoices/10");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});

/** GET /companies/:code */
describe("GET /companies/:code", () => {
  test("Returns a company with invoices based on the code", async () => {
    const resp = await request(app).get("/invoices/companies/apple");

    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      company: {
        code: "apple",
        name: "Apple Computer",
        description: "Maker of OSX.",
        invoices: [
          {
            id: 1,
            amt: 100,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
          },
          {
            id: 2,
            amt: 200,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
          },
          {
            id: 3,
            amt: 300,
            paid: true,
            add_date: expect.any(String),
            paid_date: expect.any(String),
          },
        ],
      },
    });
  });

  test("Returns 404 status response when not found", async () => {
    const resp = await request(app).get("/invoices/companies/li");

    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual(notFound);
  });
});
