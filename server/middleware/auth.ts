import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123'

export interface AuthRequest extends Request {
  userId?: string
}

/**
 * Middleware xác thực JWT
 * Lấy token từ Authorization: Bearer <token>
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Chưa đăng nhập. Vui lòng đăng nhập lại.' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }

    // Verify user vẫn tồn tại
    const user = await User.findById(decoded.userId).select('_id')
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại.' })
    }

    req.userId = decoded.userId
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' })
    }
    return res.status(401).json({ message: 'Token không hợp lệ.' })
  }
}