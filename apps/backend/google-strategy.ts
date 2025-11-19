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
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Only initialize if credentials are provided
  if (!clientID || !clientSecret) {
    console.warn('Google OAuth credentials not found. Google authentication will be disabled.');
    return;
  }

  const callbackURL = `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      // keep simple: pass profile through; handle DB in the callback route
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}
