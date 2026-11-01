const Joi = require('joi');

// Pesan error dalam bahasa Indonesia ({{#label}} = nama field)
const messages = {
  'any.required': '{{#label}} wajib diisi',
  'string.base': '{{#label}} harus berupa teks',
  'string.empty': '{{#label}} tidak boleh kosong',
  'string.email': 'Format email tidak valid',
  'string.min': '{{#label}} minimal {{#limit}} karakter',
  'string.max': '{{#label}} maksimal {{#limit}} karakter',
  'any.only': '{{#label}} harus salah satu dari {{#valids}}',
};

// Aturan untuk POST /api/auth/register
const registerSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  // trim + lowercase: sekaligus menormalisasi email
  email: Joi.string().trim().lowercase().email().max(150).required(),
  gender: Joi.string().valid('male', 'female').required(),
  // maks 72 karena bcrypt hanya memakai 72 byte pertama password
  password: Joi.string().min(6).max(72).required(),
}).messages(messages);

// Aturan untuk POST /api/auth/login
const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().required(),
  password: Joi.string().required(), // tidak dicek panjangnya saat login
}).messages(messages);

module.exports = { registerSchema, loginSchema };