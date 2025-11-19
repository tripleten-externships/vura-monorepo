import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

/**
 * Initialize Google Passport strategy.
 *
 * Expects env:
 *  - GOOGLE_CLIENT_ID
 *  - GOOGLE_CLIENT_SECRET
 *  - BACKEND_URL (optional, defaults to http://localhost:3001)
 *
 * The callback route (/auth/google/callback) will receive the profile as req.user.
 * Keep DB work in the callback route in keystone.ts to avoid coupling strategy to your DB.
 */
export default function initGoogleStrategy() {
  // Validate required environment variables
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('GOOGLE_CLIENT_ID is not set. Google OAuth will not work.');
    return;
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('GOOGLE_CLIENT_SECRET is not set. Google OAuth will not work.');
    return;
  }

  const callbackURL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      // keep simple: pass profile through; handle DB in the callback route
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}
