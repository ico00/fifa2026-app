const jwt = require('jsonwebtoken');

// Environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Default za development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Proverava admin lozinku i vraća JWT token
 */
function login(password) {
    if (password === ADMIN_PASSWORD) {
        // Kreiraj JWT token koji ističe za 7 dana
        const token = jwt.sign(
            { role: 'admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        return { success: true, token };
    }
    return { success: false, message: 'Pogrešna lozinka' };
}

/**
 * Proverava validnost JWT tokena
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Express middleware za zaštitu ruta
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Neautorizovan pristup - token nije prosleđen' });
    }

    const token = authHeader.substring(7); // Ukloni "Bearer "
    const result = verifyToken(token);

    if (!result.valid) {
        return res.status(401).json({ error: 'Neautorizovan pristup - nevažeći token' });
    }

    req.user = result.decoded;
    next();
}

module.exports = {
    login,
    verifyToken,
    authMiddleware
};
