import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

async function connect() {
  const db = await mongoose.connect(process.env.DATABASE_URL);
  console.log("database connected");
  return db;
}

export default connect;
