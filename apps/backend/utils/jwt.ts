import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

//this function creates a signed JWT when the user logs in
export function generateToken(user: { id: any; email: any }) {
  return jwt.sign(
    { id: user.id, email: user.email }, // payload
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

//this function decode and validate JWT on future requests
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
