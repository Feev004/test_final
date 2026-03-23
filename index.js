const express = require("express");
const app = express();
const multer = require("multer");
const pool = require("./DB");
const PORT = 3000;

//images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.substring(file.originalname.lastIndexOf("."));
    cb(null, `student-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static("public"));
app.use("/images", express.static("images")); 

app.get("/api/test_", async (req, res) => {
  try {
    const sql =
      `SELECT student.image_url, student.id, student.firstname, student.lastname , student.age, class.name as year_ FROM student JOIN class ON student.class_id = class.id;`
    const [products] = await pool.query(sql);
    // console.log("test",products);
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/test_class", async (req, res) => {
  try {
    const sql =
      `SELECT * FROM class;`
    const [products] = await pool.query(sql);
    // console.log("test",products);
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/test_/:id", async (req, res) => {
  const studentId = req.params.id;
  try {
    const sql = `SELECT student.id, student.firstname, student.lastname, student.age, student.class_id, student.image_url FROM student WHERE id = ?`;
    const [student] = await pool.query(sql, [studentId]);
    if (student.length > 0) {
      res.json(student[0]);
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/test_/:id", async (req, res) => {
  const studentId = req.params.id;
  try {
    const sql = `DELETE FROM student WHERE id = ?`;
    await pool.query(sql, [studentId]);
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/test_/:id", upload.single("image"), async (req, res) => {
  const studentId = req.params.id;
  try {
    const { firstname, lastname, age, class_id } = req.body;
    let image_url = null;

    if (req.file && req.file.filename) {
      image_url = `/images/${req.file.filename}`;
      const sql = `UPDATE student SET firstname = ?, lastname = ?, age = ?, class_id = ?, image_url = ? WHERE id = ?`;
      await pool.query(sql, [firstname, lastname, age, class_id, image_url, studentId]);
    } else {
      const sql = `UPDATE student SET firstname = ?, lastname = ?, age = ?, class_id = ? WHERE id = ?`;
      await pool.query(sql, [firstname, lastname, age, class_id, studentId]);
    }
    res.json({ message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    console.error("Update error", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/test_", upload.single("image"), async (req, res) => {
  try {
    const { firstname, lastname, age, class_id } = req.body;
    let image_url = null;

    if (req.file && req.file.filename) {
      image_url = `/images/${req.file.filename}`;
    }

    const sql = `INSERT INTO student (firstname, lastname, age, class_id, image_url) VALUES (?, ?, ?, ?, ?)`;
    await pool.query(sql, [firstname, lastname, age, class_id, image_url]);
    res.json({ message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    console.error("Insert error", err);
    res.status(500).json({ error: err.message });
  }
});

function render(request, response) {
  let url = request.url;
  url = url.endsWith("/") ? url : url + "/";
  let fileName = "/";
  switch (url) {
    case "/":
      fileName += "index.html";
      break;
  }
  response.sendFile(__dirname + "/" + fileName);
}

app.get("/", render);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
