const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Local email/password auth
router.post('/register', authController.register);
router.post('/verify-register', authController.verifyRegister);
router.post('/login', authController.login);

// Forgot / reset password (públicas)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// OAuth — get redirect URLs
router.get('/oauth/google', authController.googleOAuthUrl);
router.get('/oauth/facebook', authController.facebookOAuthUrl);
router.post('/oauth/facebook/token', authController.facebookTokenLogin);

// OAuth — exchange Supabase session tokens for app JWT
router.post('/oauth/callback', authController.oauthCallback);

// Protected: get / delete current user
router.get('/me',    verifyToken, authController.getMe);
router.delete('/me', verifyToken, authController.deleteMe);

// Protected: update user password
router.post('/send-password-code', verifyToken, authController.sendPasswordCode);
router.put('/update-password', verifyToken, authController.updatePassword);

module.exports = router;
