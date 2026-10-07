import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import googleAuthRoutes from './routes/googleAuth'
import documentRoutes from './routes/documents'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scanpro'

// Tăng giới hạn body vì upload ảnh base64
app.use(cors())
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', googleAuthRoutes)
app.use('/api/documents', documentRoutes)

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  })
})

// 404 handler
app.use((_, res) => {
  res.status(404).json({ message: 'Endpoint không tồn tại.' })
})

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server error:', err)
  res.status(500).json({ message: 'Lỗi server: ' + (err.message || 'unknown') })
})

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`   - Auth:        http://localhost:${PORT}/api/auth`)
      console.log(`   - Documents:   http://localhost:${PORT}/api/documents`)
      console.log(`   - Health:      http://localhost:${PORT}/api/health`)
    })
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err.message)
    process.exit(1)
  })