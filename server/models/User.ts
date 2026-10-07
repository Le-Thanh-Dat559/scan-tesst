import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String, required: false }, // optional cho OAuth users
  avatar: { type: String }, // Google profile picture

  // OAuth providers
  googleId: { type: String, sparse: true, unique: true },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
}, { timestamps: true })

// Index cho googleId (sparse: chỉ user Google mới có)
userSchema.index({ googleId: 1 }, { unique: true, sparse: true })

export default mongoose.model('User', userSchema)