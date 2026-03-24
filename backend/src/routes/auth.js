const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Local email/password auth
router.post('/register', authController.register);
router.post('/login', authController.login);

// OAuth — get redirect URLs
router.get('/oauth/google', authController.googleOAuthUrl);
router.get('/oauth/facebook', authController.facebookOAuthUrl);

// OAuth — exchange Supabase session tokens for app JWT
router.post('/oauth/callback', authController.oauthCallback);

// Protected: get / delete current user
router.get('/me',    verifyToken, authController.getMe);
router.delete('/me', verifyToken, authController.deleteMe);

module.exports = router;
