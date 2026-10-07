import { OAuth2Client } from 'google-auth-library'

let _client: OAuth2Client | null = null

function getClient(): OAuth2Client {
  if (_client) return _client
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      '[Google OAuth] Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI trong .env. ' +
      'Tính năng đăng nhập bằng Google sẽ không hoạt động cho đến khi cấu hình.'
    )
  }

  _client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
  return _client
}

function getRedirectUri(): string {
  const uri = process.env.GOOGLE_REDIRECT_URI
  if (!uri) throw new Error('[Google OAuth] Thiếu GOOGLE_REDIRECT_URI trong .env')
  return uri
}

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID
  if (!id) throw new Error('[Google OAuth] Thiếu GOOGLE_CLIENT_ID trong .env')
  return id
}

/**
 * Tạo URL để redirect user sang Google OAuth consent screen
 */
export function getGoogleAuthUrl(state: string): string {
  return getClient().generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    state,
    prompt: 'consent',
  })
}

export interface GoogleProfile {
  googleId: string
  email: string
  name: string
  picture?: string
  emailVerified: boolean
}

/**
 * Đổi authorization code -> tokens, sau đó lấy profile
 */
export async function verifyGoogleCode(code: string): Promise<GoogleProfile> {
  const client = getClient()
  // 1. Đổi code lấy tokens
  const { tokens } = await client.getToken(code)

  if (!tokens.id_token) {
    throw new Error('Google không trả về id_token.')
  }

  // 2. Verify id_token + lấy thông tin user
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: getClientId(),
  })

  const payload = ticket.getPayload()
  if (!payload) {
    throw new Error('Không thể verify id_token từ Google.')
  }

  if (!payload.email || !payload.sub) {
    throw new Error('Google profile thiếu email hoặc sub.')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture,
    emailVerified: payload.email_verified || false,
  }
}