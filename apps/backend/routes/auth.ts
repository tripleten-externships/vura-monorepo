import { Express, Request, Response } from 'express';
import passport from 'passport';
import { generateToken } from '../utils/jwt';

/**
 * Setup OAuth routes for authentication
 * @param app Express application
 * @param context Keystone context for database access
 */
export function authRoutes(app: Express, context: any) {
  // Initialize Passport middleware
  app.use(passport.initialize());

  /**
   * Initiate Google OAuth flow
   * GET /auth/google
   */
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false, // We're using JWT tokens, not sessions
    })
  );

  /**
   * Google OAuth callback handler
   * GET /auth/google/callback
   */
  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/auth/failure',
    }),
    async (req: Request, res: Response) => {
      try {
        const profile = req.user as any;

        if (!profile || !profile.emails || profile.emails.length === 0) {
          return res.redirect('/auth/failure?error=no_email');
        }

        const email = profile.emails[0].value;
        const name = profile.displayName || email.split('@')[0];
        const avatarUrl = profile.photos?.[0]?.value;

        // Check if user exists
        let user = await context.prisma.user.findUnique({
          where: { email },
        });

        // Create user if doesn't exist
        if (!user) {
          user = await context.prisma.user.create({
            data: {
              email,
              name,
              avatarUrl,
              password: '', // Empty password for OAuth users
              role: 'user',
              isAdmin: false,
            },
          });
        } else {
          // Update last login date
          await context.prisma.user.update({
            where: { id: user.id },
            data: {
              lastLoginDate: new Date(),
              // Optionally update avatar if changed
              ...(avatarUrl && { avatarUrl }),
            },
          });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/auth/failure?error=server_error');
      }
    }
  );

  /**
   * OAuth failure handler
   * GET /auth/failure
   */
  app.get('/auth/failure', (req: Request, res: Response) => {
    const error = req.query.error || 'authentication_failed';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=${error}`);
  });
}
