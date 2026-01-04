import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';

export const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
);

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    
    res.json({ valid: true, user: payload });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});
