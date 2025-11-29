import express, { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { KeystoneContext } from '@keystone-6/core/types';
import type { Profile } from 'passport-google-oauth20';
import { FrontendAuthProvider, FrontendAuthService } from '../services/auth';
import { getEventBus, initEventBus } from '../api/subscriptions/eventBus';
import type { Context } from '../types/context';
import type { FrontendAuthResult } from '../services/auth';

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
  app.use('/auth/apple/native', express.json());

  const resolveEventBus = () => {
    try {
      return getEventBus();
    } catch {
      return initEventBus();
    }
  };

  const buildRedirect = (result: FrontendAuthResult, state?: string | string[]) => {
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', result.token);
    redirectUrl.searchParams.set('jwt', result.jwt);
    redirectUrl.searchParams.set('userId', result.user.id);
    redirectUrl.searchParams.set('email', result.user.email || '');
    if (state && typeof state === 'string') {
      redirectUrl.searchParams.set('state', state);
    }
    return redirectUrl.toString();
  };

  const getAuthService = async () =>
    new FrontendAuthService({
      context: (await context()) as Context,
      eventBus: resolveEventBus(),
    });

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
        const avatarUrl = profile.photos?.[0]?.value;

        const authService = await getAuthService();
        const result = await authService.upsertOAuthAccount(FrontendAuthProvider.GOOGLE, {
          email,
          providerAccountId: profile.id,
          name,
          avatarUrl,
        });

        res.redirect(buildRedirect(result, req.query.state));
      } catch (error) {
        console.error('OAuth callback error:', error);
        next(error);
      }
    }
  );

  /**
   * Native Apple Sign-in handler for mobile clients.
   * Expects the client to send verified identity information.
   */
  app.post('/auth/apple/native', async (req: Request, res: Response) => {
    const { email, providerAccountId, name, avatarUrl } = req.body || {};

    if (!email || !providerAccountId) {
      return res.status(400).json({ error: 'email and providerAccountId are required' });
    }

    try {
      const authService = await getAuthService();
      const result = await authService.upsertOAuthAccount(FrontendAuthProvider.APPLE, {
        email,
        providerAccountId,
        name,
        avatarUrl,
      });

      res.json({
        token: result.token,
        jwt: result.jwt,
        user: result.user,
      });
    } catch (error) {
      console.error('Apple auth error:', error);
      res.status(500).json({ error: 'Failed to complete Apple sign-in' });
    }
  });

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
