// Membuat middleware validasi dari sebuah skema Joi.
// Dipakai di route: validate(registerSchema)
const validate = (schema) => (req, res, next) => {
  // ?? {} : jaga-jaga kalau request tidak membawa body sama sekali
  const { error, value } = schema.validate(req.body ?? {}, {
    abortEarly: false,  // kumpulkan semua error, bukan berhenti di yang pertama
    stripUnknown: true, // buang field yang tidak ada di skema
  });

  if (error) {
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: error.details.map((d) => d.message),
    });
  }

  req.body = value; // pakai data yang sudah dirapikan (email lowercase, dll)
  next();
};

module.exports = validate;