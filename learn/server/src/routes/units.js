const express = require('express');
const router = express.Router();
const unitActionsController = require('../controllers/unitActionsController');
// Add any authentication or validation middleware as needed
// const { protect } = require('../middleware/authMiddleware'); // Example

// Route for batch unlocking units
// POST /api/units/batch-unlock
router.post('/batch-unlock', unitActionsController.batchUnlockUnits);

module.exports = router; 