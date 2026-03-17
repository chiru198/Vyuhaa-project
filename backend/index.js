import dotenv from "dotenv";
dotenv.config();
console.log("Database User:", process.env.DB_USER);
console.log("Database Name:", process.env.DB_NAME);
import bcrypt from "bcrypt";

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";
import { authenticateToken } from "./authMiddleware.js";
import { jsPDF } from "jspdf";
import { companyLogo } from "./logo.js"; // This is your company logo in base64 format, imported from a separate file for cleaner code
import multer from "multer";
import { generateLBCReport } from "./pdfGenerator.js"; // <--- Import here

// Create directory if it doesn't exist
// const uploadDir = "uploads/pathology";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

const app = express();

// Also update Express body-parser limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true })); // This defines 'upload'

// Logic: Allow your frontend to access the API
app.use(
  cors({
    origin: "http://localhost:8080", // Replace with your frontend URL if different
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// ... your routes (api/customer/samples, etc.)

/* ===============================
   MIDDLEWARE
================================ */

/* ===============================
   BASIC ROUTES
================================ */

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   AUTH
================================ */

//SIGNUP ENDPOINT FOR THE CUSTOMER PORTAL. THIS ALLOWS NEW CUSTOMERS TO SIGN UP AND AUTOMATICALLY GETS THE 'CUSTOMER' ROLE ID FROM THE ROLES TABLE TO ASSIGN TO THE NEW USER. IT ALSO HASHES THE PASSWORD USING BCRYPT BEFORE STORING IT IN THE DATABASE FOR BETTER SECURITY.
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, role } = req.body; // Added role here

  try {
    const userExist = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    if (userExist.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Look up the role dynamically based on the string passed from frontend
    const targetRole = role ? role.toLowerCase() : "customer";

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE LOWER(name) = $1",
      [targetRole],
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const roleId = roleResult.rows[0].id;

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id, name, email`,
      [name, email, hashedPassword, roleId],
    );

    res.status(201).json({
      success: true,
      message: `User registered successfully as ${targetRole}!`,
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("--- Login Attempt (Bcrypt) ---");
  console.log("Email:", email);

  try {
    // 1. Find the user and their role (Same as your original query)
    const result = await pool.query(
      "SELECT u.*, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE LOWER(u.email) = LOWER($1)",
      [email],
    );

    if (result.rows.length === 0) {
      console.log(" User not found in database.");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    // 2. BCRYPT CHECK: Compare the typed password with the hashed password in the DB
    // bcrypt.compare(plain_text, hashed_string) returns a boolean
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log(" Password mismatch via bcrypt comparison.");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    console.log(" Login Successful for:", user.email);

    // 3. Send back the response (Kept identical for your frontend)
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(" Server Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===============================
   USERS (CREATE USER) ✅
================================ */
// This part is for creating new users through admin /usermanagement / add new user form

app.post("/users", async (req, res) => {
  const { name, email, role } = req.body;

  try {
    // 1. Role lookup (Keep your existing logic)
    const roleQuery = await pool.query(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER($1)",
      [role],
    );

    if (roleQuery.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const roleUuid = roleQuery.rows[0].id;

    // 2. NEW: Hash the default password
    const defaultPassword = "Password@1";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 3. Insert the user with the hashedPassword
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role_id, is_active) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true) 
       RETURNING id, name, email`,
      [name, email, hashedPassword, roleUuid], // Use hashedPassword here!
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
/* ===============================
   USERS (FETCH ALL USERS) ✅
================================ */

/* ===============================
   PATHOLOGIST DASHBOARD
================================ */

app.get("/api/dashboard/pathologist", async (req, res) => {
  try {
    // Pending Reviews
    const pendingResult = await pool.query(`
      SELECT COUNT(*) 
      FROM samples
      WHERE status = 'pending'
    `);

    // Completed Reviews
    const completedResult = await pool.query(`
      SELECT COUNT(*) 
      FROM test_results
      WHERE report_generated = true
    `);

    // High Priority (example logic)
    const highPriorityResult = await pool.query(`
      SELECT COUNT(*)
      FROM samples
      WHERE status = 'urgent'
    `);

    // Total Assigned
    const totalAssignedResult = await pool.query(`
      SELECT COUNT(*)
      FROM samples
    `);

    // Recent Samples
    // Inside app.get("/api/dashboard/pathologist", ...)
    // Find the "Recent Samples" query and update it:
    const recentSamples = await pool.query(`
    SELECT 
    s.id,
    s.barcode,        -- 🟢 Ensure barcode is here
    s.sample_type,
    s.status,
    s.collected_at,
    s.doctor_name,    -- 🟢 Added
    s.hospital_name,  -- 🟢 Added
    p.name AS patient_name,
    p.age,            -- 🟢 Added
    p.gender,         -- 🟢 Added
    l.name AS lab_name
  FROM samples s
  JOIN patients p ON s.patient_id = p.id
  JOIN labs l ON s.lab_id = l.id
  ORDER BY s.collected_at DESC
  LIMIT 8
`);

    res.json({
      pending: parseInt(pendingResult.rows[0].count),
      completed: parseInt(completedResult.rows[0].count),
      highPriority: parseInt(highPriorityResult.rows[0].count),
      totalAssigned: parseInt(totalAssignedResult.rows[0].count),
      recentSamples: recentSamples.rows,
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/pathologist/review-queue", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.barcode,
        s.sample_type,
        s.status,
        s.collected_at,
        s.doctor_name,    -- 🟢 Added
        s.hospital_name,  -- 🟢 Added
        p.name AS patient_name,
        p.age,            -- 🟢 Added
        p.gender,         -- 🟢 Added
        l.name AS lab_name
      FROM samples s
      JOIN patients p ON s.patient_id = p.id
      JOIN labs l ON s.lab_id = l.id
      WHERE s.status IN ('review', 'pending', 'urgent') 
      ORDER BY s.collected_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/samples/:id/finalize", async (req, res) => {
  const { id } = req.params;
  const { assigned_pathologist } = req.body;

  try {
    await pool.query(
      `
      UPDATE samples
      SET status = 'completed',
          assigned_pathologist = $1
      WHERE id = $2
    `,
      [assigned_pathologist, id],
    );

    res.json({ message: "Sample finalized" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/test-results", async (req, res) => {
  const { sample_id, diagnosis, recommendations } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO test_results (sample_id, diagnosis, recommendations, report_generated)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `,
      [sample_id, diagnosis, recommendations],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/pathologist/recent-activity", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.barcode
      FROM test_results tr
      JOIN samples s ON tr.sample_id = s.id
      WHERE tr.report_generated = true
      ORDER BY s.collected_at DESC
      LIMIT 5
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//FOR CREATING PDF REPORTS in pdf format

import fs from "fs";
import path from "path";

//This post api endpoint is used for generating a PDF for preview purposes only. It accepts the same data as the finalize route but does not save anything to the database or filesystem. Instead, it generates the PDF in memory and sends it back to the frontend, where you can open it in a new tab for previewing before finalizing. This allows you to see exactly how the report will look with the real data before you commit to saving it.
app.post("/api/report/preview", (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  // console.log("Received data for PDF preview:", req.body);
  generateLBCReport(req.body, res);
});
app.post("/api/report/finalize", (req, res) => {
  const finalDir = path.join(__dirname, "final_reports");
  if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir);

  const filePath = path.join(finalDir, `${req.body.mr_number}.pdf`);
  const stream = fs.createWriteStream(filePath);

  generateLBCReport(req.body, stream);

  stream.on("finish", () => {
    res.json({ success: true, message: "Report saved permanently." });
  });
});
// Pathology ends here

//accession starts here
//FOR PUTTING PATIENTS DATA INTO SAMPLES
app.post("/api/accession/add-sample", async (req, res) => {
  const {
    barcode,
    patient_name,
    age,
    gender,
    lab_id,
    sample_type,
    accession_id,
    // ✅ NEW FIELDS FROM FRONTEND
    doctor_name,
    hospital_name,
    clinical_history,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // STEP 1: Insert into patients
    const patientQuery = `
      INSERT INTO patients (name, age, gender, customer_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id;
    `;
    const patientRes = await client.query(patientQuery, [
      patient_name,
      age || null,
      gender || null,
      accession_id,
    ]);
    const newPatientId = patientRes.rows[0].id;

    // STEP 2: Insert into samples (Updated with 3 new columns)
    const sampleQuery = `
      INSERT INTO samples (
        barcode, 
        patient_id, 
        customer_id, 
        lab_id, 
        sample_type, 
        status, 
        collected_at,
        doctor_name,
        hospital_name,
        clinical_history
      )
      VALUES ($1, $2, $3, $4, $5, 'received', NOW(), $6, $7, $8)
      RETURNING *;
    `;

    const sampleRes = await client.query(sampleQuery, [
      barcode,
      newPatientId,
      accession_id,
      lab_id,
      sample_type,
      doctor_name || null, // $6
      hospital_name || null, // $7
      clinical_history || null, // $8
    ]);

    await client.query("COMMIT");
    res.status(201).json({ message: "Success", sample: sampleRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  } finally {
    client.release();
  }
});
//FOR FINDING PATIENTS WITHOUT SAMPLES (PENDING PATIENTS IN ACCESSION QUEUE)
app.get("/api/accession/pending-patients", async (req, res) => {
  try {
    const query = `
      SELECT id, name, age, gender, customer_id 
      FROM patients 
      WHERE id NOT IN (SELECT patient_id FROM samples WHERE patient_id IS NOT NULL)
      ;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        r.name AS role,
        u.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
//ACCESSION ENDS HERE
//TECHNICIAN DASHBOARD STARTS HERE
//FOR STORING IMAGE URL IN DATABASE AND MOVING SAMPLE TO PATHOLOGIST REVIEW

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is the BASE directory for Maharshi's slides
const baseMaharshiDir = path.join(
  __dirname,
  "..",
  "openslide-api",
  "static",
  "tiles",
  "Doctors",
  "Maharshi",
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { barcode } = req.body; // Extract barcode from the form body

    if (!barcode) {
      return cb(
        new Error("Barcode is required to create target directory"),
        null,
      );
    }

    // NEW: Define the specific folder for THIS barcode
    // Path: .../Maharshi/SMP0061/
    const barcodeDir = path.join(baseMaharshiDir, barcode);

    // Automatically create the folder (e.g., SMP0061) if it doesn't exist
    if (!fs.existsSync(barcodeDir)) {
      fs.mkdirSync(barcodeDir, { recursive: true });
    }

    cb(null, barcodeDir);
  },
  filename: (req, file, cb) => {
    const { barcode } = req.body;
    const ext = path.extname(file.originalname).toLowerCase();

    // Saves as SMP0061.ndpi inside the SMP0061 folder
    cb(null, `${barcode}${ext}`);
  },
});

const upload = multer({ storage });

app.post(
  "/api/upload-pathology-dual",
  upload.fields([
    { name: "ndpiFile", maxCount: 1 },
    { name: "ndpaFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { barcode, sampleId } = req.body;

      if (!req.files || !req.files["ndpiFile"]) {
        return res.status(400).json({ error: "NDPI slide file is required." });
      }

      // Update Database: Move to Review Queue
      // Also store the path so your OpenSeadragon viewer knows exactly where to look
      const relativePath = `/static/tiles/Doctors/Maharshi/${barcode}/${barcode}.ndpi`;

      await pool.query(
        "UPDATE samples SET status = 'review', imaging_url = $1, collected_at = NOW() WHERE id = $2",
        [relativePath, sampleId],
      );

      console.log(`✅ Success: Created folder and stored files for ${barcode}`);

      res.status(200).json({
        message: `Folder ${barcode} created and files stored successfully.`,
        path: relativePath,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during file processing." });
    }
  },
);
/* ===============================
   LABS (FETCH LAB LOCATIONS) ✅
================================ */

// Get all labs
app.get("/api/labs", async (req, res) => {
  try {
    // REMOVED 'created_at' and changed to 'name'
    const result = await pool.query(
      "SELECT id, name, address, contact_info, active FROM labs ORDER BY name ASC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

// Create new lab
// Add a new Lab
app.post("/api/labs", async (req, res) => {
  const { name, address } = req.body;

  try {
    // Only inserting into the columns you actually have
    const result = await pool.query(
      "INSERT INTO labs (name, address, active, contact_info) VALUES ($1, $2, true, '{}') RETURNING *",
      [name, address],
    );

    console.log("✅ Lab Created:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Database insertion failed" });
  }
});
// Delete lab
app.delete("/api/labs/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM labs WHERE id = $1", [req.params.id]);
    res.json({ message: "Lab deleted" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.put("/api/labs/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Lab name is required" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE labs
      SET name = $1
      WHERE id = $2
      RETURNING *
      `,
      [name, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lab not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE LAB ERROR:", err);
    res.status(500).json({ error: "Failed to update lab" });
  }
});

/* ===============================
   PATIENTS (CREATE PATIENT) ✅
================================ */

app.post("/api/patients", async (req, res) => {
  const { name, age, gender } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Patient name required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO patients (name, age, gender)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [name, age || null, gender || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("PATIENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SAMPLES
================================ */
// FETCH ALL SAMPLES (Used by Accession Queue & Technician Assigned Samples)
//Fetching all samples for the Report pages also, because we need the patient and lab info to show in the report details page. This is a more comprehensive query that joins with patients and labs to get all the info you need in one go. You can filter or sort on the frontend as needed for different views (like just pending samples for the queue, or all samples for the report list).
app.get("/api/samples", async (req, res) => {
  try {
    const { customerId } = req.query;

    // Added s.doctor_name, s.hospital_name, and s.collected_at to the SELECT
    let queryText = `
      SELECT 
        s.id, 
        s.barcode,
        s.sample_type,
        s.status,
        s.doctor_name,    -- 🟢 Added
        s.hospital_name,  -- 🟢 Added
        s.collected_at,   -- 🟢 Added (Required for the date logic)
        s.clinical_history, -- 🟢 Added (Required for the report details page)
        p.name AS patient_name, 
        p.age,
        p.gender,
        l.name AS lab_name
      FROM samples s
      LEFT JOIN patients p ON s.patient_id = p.id
      LEFT JOIN labs l ON s.lab_id = l.id
    `;

    const queryParams = [];

    if (customerId) {
      queryText += ` WHERE s.patient_id = $1`;
      queryParams.push(customerId);
    }

    queryText += ` ORDER BY s.collected_at DESC`;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error("GET SAMPLES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/samples", async (req, res) => {
  const { barcode, sample_type } = req.body;

  //  FIXED VALID FOREIGN KEYS
  const fixedLabId = "2ab40c9f-1414-4048-bb8e-2acb934a8f83";
  const fixedPatientId = "a9bda45b-8dd4-4d3a-8773-5ee2d239ad20";

  try {
    const result = await pool.query(
      `
      INSERT INTO samples
      (barcode, lab_id, patient_id, sample_type, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
      `,
      [barcode, fixedLabId, fixedPatientId, sample_type, "pending"],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE SAMPLE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
//THIS ENDPOINT IS CREATED FOR THE CUSTOMER PORTAL AND SUBMITTING SAMPLE FROM THE SUBMIT SAMPLES PAGES.
app.post("/api/samples/submit", async (req, res) => {
  const { patientName, patientAge, patientGender, customerId } = req.body;

  try {
    // Logic: Only insert into the patients table
    const query = `
      INSERT INTO patients (name, age, gender, customer_id) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id;
    `;

    const result = await pool.query(query, [
      patientName,
      patientAge,
      patientGender,
      customerId,
    ]);

    res.status(201).json({
      success: true,
      patientId: result.rows[0].id,
      message: "Patient registered successfully",
    });
  } catch (err) {
    console.error("PATIENT REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Failed to register patient" });
  }
});

//I THINK SAMPLES PART IS END HERE FOR NOW , FURTHER I NEED TO ADD MORE ENDPOINTS FOR UPDATING SAMPLE STATUS, ASSIGNING PATHOLOGISTS, ETC. BUT LET'S FIRST TEST THIS BASIC FLOW AND THEN ITERATE.
/* ===============================
   BILLING RECORDS
================================ */

app.get("/api/billing-records", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, amount, payment_status, created_at
      FROM billing_records
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("BILLING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   TEST RESULTS
================================ */

app.get("/api/test-results", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, sample_id, diagnosis, recommendations, report_generated
      FROM test_results
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("TEST RESULTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   PRICING TIERS
================================ */

app.get("/api/pricing-tiers", async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        tier_name, 
        lbc_price::FLOAT, 
        hpv_price::FLOAT, 
        co_test_price::FLOAT 
      FROM pricing_tiers 
      ORDER BY lbc_price DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).json({ error: "Failed to fetch pricing tiers" });
  }
});
/* ===============================
   CUSTOMERS
================================ */
// --- GET ALL CUSTOMERS ---
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        organization_name as name, 
        contact_number as contact, 
        email, 
        pricing_tier as tier, 
        location 
      FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1)
      ORDER BY organization_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
//THIS IS THE ENDPOINT FOR THE TRACK SAMPLE PAGE IN CUSTOMER PORTAL FOR FETCHEING THE SAMPLES RELATED TO THE CUSTOMER. IT JOINS THE SAMPLES WITH THE PATIENTS TABLE TO GET THE PATIENT NAME, WHICH IS DISPLAYED IN THE TRACK SAMPLE PAGE. YOU CAN ALSO ADD MORE FIELDS TO THE SELECT STATEMENT IF YOU WANT TO SHOW MORE INFO ABOUT THE SAMPLE OR PATIENT IN THE TRACKING PAGE.
app.get("/api/customer/samples", async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required." });
    }

    // This query links the physical sample to the patient's name
    const query = `
      SELECT 
        s.id, 
        s.barcode, 
        s.status, 
        s.sample_type,
        s.collected_at as accession_date,
        p.name as patient_name
      FROM samples s
      INNER JOIN patients p ON s.patient_id = p.id
      WHERE s.customer_id = $1
      ORDER BY s.collected_at DESC;
    `;

    const result = await pool.query(query, [customerId]);

    // Return the list to the frontend
    res.json(result.rows);
  } catch (err) {
    console.error("Tracking API Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- CREATE CUSTOMER ---
//CREATE CUSTOMER ENDPOINT FOR THE ADMIN TO CREATE CUSTOMERS FROM THE ADMIN DASHBOARD. THIS ENDPOINT HASHES A DEFAULT PASSWORD "Password@1" FOR THE CUSTOMER USING BCRYPT BEFORE STORING IT IN THE DATABASE. WHEN THE CUSTOMER LOGS IN FOR THE FIRST TIME, THEY SHOULD BE PROMPTED TO CHANGE THIS DEFAULT PASSWORD TO SOMETHING SECURE AND PERSONAL.
app.post("/api/customers", async (req, res) => {
  const { organizationName, contactNumber, email, pricingTier, location } =
    req.body;

  try {
    // 1. Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // 2. NEW: Hash the default password for the customer
    const defaultPassword = "Password@1";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // 3. Insert the customer with the hashedPassword
    const result = await pool.query(
      `INSERT INTO users 
      (name, email, password_hash, role_id, organization_name, contact_number, pricing_tier, location, is_active) 
      VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'customer' LIMIT 1), $4, $5, $6, $7, true) 
      RETURNING id, organization_name as name, email`,
      [
        organizationName,
        email,
        hashedPassword, // Used the hashed version instead of "Password@1"
        organizationName,
        contactNumber,
        pricingTier,
        location,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// --- UPDATE CUSTOMER ---
app.put("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { organizationName, contactNumber, email, pricingTier, location } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET
         name = $1,
         organization_name = $1,
         email = $2,
         contact_number = $3,
         pricing_tier = $4,
         location = $5
       WHERE id = $6 AND role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1)
       RETURNING id, organization_name as name, email, contact_number as contact, pricing_tier as tier, location`,
      [organizationName, email, contactNumber, pricingTier, location, id],
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// --- DELETE CUSTOMER ---
app.delete("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role_id = (SELECT id FROM roles WHERE name = 'customer' LIMIT 1) RETURNING id",
      [id],
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});
//For downloading the finalized report PDF by sample ID. This endpoint looks up the file path in the database and sends the file as a download to the client.

// const path = require("path"); // Ensure this is at the top of your file

app.get("/api/reports/download-by-sample/:sampleId", async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { customerId } = req.query;

    // 1. Validate inputs
    if (!customerId || customerId === "undefined") {
      return res
        .status(400)
        .json({ error: "Customer ID is missing or undefined." });
    }

    // 2. Debug logs: Check your terminal to see if these match your pgAdmin values exactly
    console.log(
      `Download attempt - Sample: ${sampleId}, Customer: ${customerId}`,
    );

    const query = `
      SELECT fr.file_path 
      FROM finalized_reports fr
      JOIN samples s ON fr.sample_id = s.id
      WHERE fr.sample_id = $1::uuid 
      AND s.customer_id = $2::uuid;
    `;

    const result = await pool.query(query, [
      sampleId.trim(),
      customerId.trim(),
    ]);

    // 3. Handle 'No Rows Found' (This triggers the 403)
    if (result.rows.length === 0) {
      console.error(
        "403 Forbidden: No database match for this Sample/Customer combination.",
      );
      return res.status(403).json({
        error:
          "Access denied: You do not own this report or it is not finalized.",
      });
    }

    // 4. Handle Windows File Path
    const dbPath = result.rows[0].file_path;
    const normalizedPath = path.normalize(dbPath); // Fixes Windows backslash issues in OneDrive path

    console.log("Serving file from normalized path:", normalizedPath);

    // 5. Check if file physically exists
    if (fs.existsSync(normalizedPath)) {
      res.download(normalizedPath);
    } else {
      console.error(
        "404 Error: File found in DB but missing on disk at",
        normalizedPath,
      );
      res.status(404).json({ error: "Physical file missing on server." });
    }
  } catch (err) {
    console.error("Download API Crash:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
});
//This endpoint allows customers to see a list of their finalized reports. It uses the customerId to filter reports that belong to that customer, ensuring they only see their own data.
app.get("/api/customer/reports-list", async (req, res) => {
  const { customerId } = req.query; // Securely passed from frontend
  console.log("Fetching reports for ID:", customerId); // Add this log to verify!

  try {
    const result = await pool.query(
      `SELECT 
        fr.sample_id, 
        fr.patient_name, 
        s.barcode, 
        fr.created_at,
        fr.id as report_id
      FROM finalized_reports fr
      JOIN samples s ON fr.sample_id = s.id
      JOIN patients p ON s.patient_id = p.id
      -- Logic: Only show reports if the patient was registered by THIS customer
      WHERE p.customer_id = $1
      ORDER BY fr.created_at DESC;`,
      [customerId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* ===============================
   SERVER
================================ */

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// server.timeout = 600000;
// server.headersTimeout = 600000;
// server.keepAliveTimeout = 600000;
