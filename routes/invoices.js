/* Invoice routes for BizTime. */
const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Return info on invoices.
router.get("/", async (req, res, next) => {
  try {
    const invoices = await db.query("SELECT * FROM invoices;");

    return res.json({
      invoices: invoices.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Return a single invoice with the company details based on the invoice id.
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the invoice exists and retrieve company details.
    const invoiceWithCompany = await db.query(
      "SELECT id, amt, paid, add_date, paid_date, code, name, description FROM invoices INNER JOIN companies ON invoices.comp_code = companies.code WHERE id = $1;",
      [id]
    );

    if (invoiceWithCompany.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    const { amt, paid, add_date, paid_date, code, name, description } =
      invoiceWithCompany.rows[0];

    return res.json({
      invoice: {
        id,
        amt,
        paid,
        add_date,
        paid_date,
        company: {
          code,
          name,
          description,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// Adds an invoice based on the JSON data received.
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date;",
      [comp_code, amt]
    );

    return res.json({
      invoice: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Updates an invoice.
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;

    if (!amt) {
      throw new ExpressError("Need at least one property to update", 400);
    }

    // Check if invoice exists.
    const existingInvoice = await db.query(
      "SELECT * FROM invoices WHERE id = $1;",
      [id]
    );

    if (existingInvoice.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    const updatedInvoice = await db.query(
      "UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date;",
      [amt, id]
    );

    return res.json({
      invoice: updatedInvoice.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Deletes an invoice.
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if invoice exists.
    const existingInvoice = await db.query(
      "SELECT * FROM invoices WHERE id = $1;",
      [id]
    );

    if (existingInvoice.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    await db.query("DELETE FROM invoices WHERE id = $1;", [id]);

    return res.json({
      status: "deleted",
    });
  } catch (err) {
    next(err);
  }
});

// Returns details of company.
router.get("/companies/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    // Check if the company exists and retrieve invoice details.
    const companyWithInvoices = await db.query(
      "SELECT code, name, description, array_agg(json_build_object('id', invoices.id, 'amt', invoices.amt, 'paid', invoices.paid, 'add_date', invoices.add_date, 'paid_date', invoices.paid_date)) AS invoices FROM companies INNER JOIN invoices ON companies.code = invoices.comp_code WHERE code = $1 GROUP BY code;",
      [code]
    );

    if (companyWithInvoices.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    return res.json({
      company: companyWithInvoices.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
