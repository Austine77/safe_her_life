import mongoose from "mongoose";

mongoose.set("strictQuery", true);

let listenersAttached = false;
let connectionPromise = null;

export async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to backend/.env before starting the server."
    );
  }

  try {
    if (!listenersAttached) {
      mongoose.connection.on("connected", () => {
        console.log("MongoDB connected");
      });

      mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected");
      });

      listenersAttached = true;
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2 && connectionPromise) {
      await connectionPromise;
      return mongoose.connection;
    }

    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
    });

    await connectionPromise;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export default connectDatabase;
