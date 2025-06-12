const express = require('express');
const router = express.Router();
const { saveConfig, getConfig } = require('../controllers/configController');

router.post('/', saveConfig);

router.get('/', getConfig);

module.exports = router;
