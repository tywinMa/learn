const express = require('express');
const router = express.Router();
const { upload, solveProblem, getSolutionHistory } = require('../controllers/aiController');

// AI拍照解题接口
router.post('/solve-problem', upload.single('image'), solveProblem);

// 获取解题历史
router.get('/history', getSolutionHistory);

module.exports = router; 