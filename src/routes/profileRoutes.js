const router = require('express').Router();
const authenticate = require('../middlewares/authMiddleware');
const { getProfile } = require('../controllers/profileController');

router.get('/', authenticate, getProfile);

module.exports = router;