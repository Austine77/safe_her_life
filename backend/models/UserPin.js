import mongoose from 'mongoose';

const userPinSchema = new mongoose.Schema({
  pin: { type: String, unique: true, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserPin || mongoose.model('UserPin', userPinSchema);
