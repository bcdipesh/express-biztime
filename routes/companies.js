/* Company routes for BizTime. */
const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// Returns list of companies.
router.get("/", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM companies;");

    return res.json({ companies: result.rows });
  } catch (err) {
    next(err);
  }
});

// Returns a single company based on the company code.
router.get("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;

    const result = await db.query("SELECT * FROM companies WHERE code = $1;", [
      code,
    ]);

    if (result.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    return res.json({
      company: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Adds a company based on the JSON data received.
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description;",
      [code, name, description]
    );

    return res.json({
      company: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Edit existing company.
router.put("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const { name, description } = req.body;

    if (!name && !description) {
      throw new ExpressError("Need at least one property to update", 400);
    }

    // Check if the company exists.
    const existingCompany = await db.query(
      "SELECT * FROM companies WHERE code = $1;",
      [code]
    );

    if (existingCompany.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    // Use the || operator to provide default values if name or description is not provided.
    const updatedName = name || existingCompany.rows[0].name;
    const updatedDescription =
      description || existingCompany.rows[0].description;

    const updateResult = await db.query(
      "UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description;",
      [updatedName, updatedDescription, code]
    );

    return res.json({
      company: updateResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Deletes company.
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;

    const result = await db.query("DELETE FROM companies WHERE code = $1;", [
      code,
    ]);

    if (result.rowCount === 0) {
      throw new ExpressError("Not Found", 404);
    }

    return res.json({
      status: "deleted",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
