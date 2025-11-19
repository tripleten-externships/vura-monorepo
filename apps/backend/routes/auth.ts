import { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { KeystoneContext } from '@keystone-6/core/types';
import type { Profile } from 'passport-google-oauth20';

/**
 * Setup authentication routes for OAuth providers
 *
 * Routes:
 * - GET /auth/google - Initiate Google OAuth flow
 * - GET /auth/google/callback - Handle Google OAuth callback
 */
export function authRoutes(app: Express, context: () => Promise<KeystoneContext>) {
  // Initialize Passport middleware
  app.use(passport.initialize());

  /**
   * Initiate Google OAuth flow
   * Redirects user to Google consent screen
   */
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false, // We're using stateless JWT, not sessions
    })
  );

  /**
   * Handle Google OAuth callback
   * Creates or updates user in database and returns JWT token
   */
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000',
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Passport adds user profile to req
        const profile = req.user as Profile;

        if (!profile || !profile.emails || !profile.emails[0]) {
          return res.status(400).json({ error: 'Invalid OAuth profile received' });
        }

        const email = profile.emails[0].value;
        const name = profile.displayName || email.split('@')[0];

        // Get Keystone context
        const ctx = await context();
        const prisma = ctx.prisma;

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email,
              // Note: password is optional for OAuth users
              // You may want to add a provider field to track OAuth vs local auth
              role: 'user',
            },
          });
        }

        // Generate JWT token or create Keystone session
        // For now, we'll redirect with user info
        // You should implement proper token generation here

        const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        redirectUrl.searchParams.set('userId', user.id);
        redirectUrl.searchParams.set('email', user.email);
        redirectUrl.searchParams.set('name', user.name || '');

        res.redirect(redirectUrl.toString());
      } catch (error) {
        console.error('OAuth callback error:', error);
        next(error);
      }
    }
  );

  /**
   * Test endpoint to check if auth routes are working
   */
  app.get('/auth/status', (req: Request, res: Response) => {
    res.json({
      google: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/google/callback`,
      },
    });
  });
}
