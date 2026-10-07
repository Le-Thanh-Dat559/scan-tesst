import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User'
import { getGoogleAuthUrl, verifyGoogleCode } from '../utils/googleOAuth'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

/**
 * Tạm lưu state (CSRF) + redirect URL sau khi login thành công
 * Trong production nên dùng Redis, ở đây dùng in-memory cho dev
 */
const stateStore = new Map<string, { createdAt: number; redirect: string }>()

// Dọn dẹp state cũ (> 10 phút)
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of stateStore.entries()) {
    if (now - v.createdAt > 10 * 60 * 1000) stateStore.delete(k)
  }
}, 60 * 1000).unref()

/**
 * GET /api/auth/google
 * Bắt đầu OAuth flow - redirect user sang Google
 *
 * Query params:
 *   - redirect: URL trên frontend để redirect về sau khi login (mặc định '/')
 */
router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex')
  const redirect = (req.query.redirect as string) || '/'

  stateStore.set(state, { createdAt: Date.now(), redirect })

  const authUrl = getGoogleAuthUrl(state)
  res.redirect(authUrl)
})

/**
 * GET /api/auth/google/callback
 * Google redirect về đây với ?code=...&state=...
 *
 * - Verify state (CSRF)
 * - Đổi code lấy profile
 * - Tìm hoặc tạo User trong DB
 * - Cấp JWT
 * - Redirect về frontend với token
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query

    if (error) {
      console.error('Google OAuth error:', error)
      return res.redirect(
        `${FRONTEND_URL}/login?error=${encodeURIComponent(String(error))}`
      )
    }

    if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
      return res.redirect(
        `${FRONTEND_URL}/login?error=missing_code_or_state`
      )
    }

    // 1. Verify state
    const stored = stateStore.get(state)
    if (!stored) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=invalid_state`
      )
    }
    stateStore.delete(state) // single-use

    // 2. Đổi code -> profile
    const profile = await verifyGoogleCode(code)

    if (!profile.emailVerified) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=email_not_verified`
      )
    }

    // 3. Tìm user (theo googleId, fallback theo email)
    let user = await User.findOne({ googleId: profile.googleId })

    if (!user) {
      // Check nếu email đã tồn tại (user đăng ký local trước đó)
      user = await User.findOne({ email: profile.email })

      if (user) {
        // Link Google account vào user local
        user.googleId = profile.googleId
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google'
        if (profile.picture && !user.avatar) user.avatar = profile.picture
        await user.save()
      } else {
        // Tạo user mới
        user = new User({
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          authProvider: 'google',
          avatar: profile.picture,
          // password không cần vì đăng nhập qua Google
        })
        await user.save()
      }
    }

    // 4. Cấp JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })

    // 5. Redirect về frontend với token
    // Mặc định về /auth/callback để component GoogleCallback xử lý token
    const redirectPath = stored.redirect && stored.redirect !== '/'
      ? `/auth/callback?then=${encodeURIComponent(stored.redirect)}`
      : '/auth/callback'
    const finalUrl = `${FRONTEND_URL}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`

    res.redirect(finalUrl)
  } catch (err: any) {
    console.error('Google callback error:', err)
    res.redirect(
      `${FRONTEND_URL}/login?error=${encodeURIComponent(err.message || 'oauth_failed')}`
    )
  }
})

/**
 * GET /api/auth/google/me
 * Lấy thông tin user hiện tại (verify token)
 * Dùng khi frontend nhận token qua URL query
 */
router.get('/google/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User không tồn tại.' })
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

export default router