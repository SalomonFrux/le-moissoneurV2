const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.post('/preview', exportController.getPreview);
router.post('/download', exportController.downloadExport);

module.exports = router;
