const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post("/users", async (req, res) => {
  try {

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while creating the user" });
  }
});

app.get("/users", async (req, res) => {
  try {

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
