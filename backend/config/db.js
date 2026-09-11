import mongoose from "mongoose";
export async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI is missing. Add it to backend/.env.");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production",
  });
  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}
