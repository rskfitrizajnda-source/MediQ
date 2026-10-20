const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'mediq_super_secret_jwt_key_2026_clinic_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Login Pengguna (Admin, Dokter, Resepsionis)
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan kata sandi wajib diisi.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        doctor: {
          include: { polyclinic: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Hilangkan password dari respon
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ambil Informasi Pengguna Saat Ini (Current User)
 */
async function me(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Tidak terotentikasi.',
      });
    }

    const { password, ...userData } = req.user;

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
};

