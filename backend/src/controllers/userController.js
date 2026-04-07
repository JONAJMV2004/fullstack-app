const bcrypt = require('bcryptjs');
const UserModel = require('../models/usuarioModel.js');

const SALT_ROUNDS = 12;

/**
 * GET /api/users  (protected — self or admin)
 * Returns a list of all users. In production, restrict to admins.
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.findAll();
    return res.status(200).json({ users });
  } catch (err) {
    console.error('GetAllUsers error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

/**
 * GET /api/users/:id  (protected)
 * Returns a single user's public profile.
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Allow users to only fetch their own data (or an admin)
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('GetUserById error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

/**
 * PUT /api/users/:id  (protected)
 * Body: { name?, password? }
 * Updates a user's name and/or password.
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { name, password } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty.' });
      }
      updates.name = name.trim();
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      updates.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const user = await UserModel.update(id, updates);
    return res.status(200).json({ message: 'Profile updated.', user });
  } catch (err) {
    console.error('UpdateUser error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

/**
 * DELETE /api/users/:id  (protected)
 * Deletes a user account.
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const exists = await UserModel.findById(id);
    if (!exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await UserModel.delete(id);
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};
