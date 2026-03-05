const express = require('express');
const router = express.Router();
const multer = require('multer');
const resourceController = require('../controllers/resourceController');

// Multer 설정 (메모리 저장소)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    } else {
      cb(null, true);
    }
  }
});

// Resource API Routes (TMF639 기반)
// 디버깅 미들웨어
router.use((req, res, next) => {
  console.log(`📍 라우트 진입: ${req.method} ${req.path}`);
  next();
});

// Import endpoint - 와일드카드보다 먼저 와야함
router.post('/resource/import', upload.single('file'), (req, res, next) => {
  console.log(`📤 POST /resource/import 매칭됨`);
  resourceController.importFromExcel(req, res, next);
});

// ID 조회는 와일드카드보다 먼저 와야함
router.get('/resource/:id', (req, res, next) => {
  console.log(`🔍 GET /resource/:id 매칭됨 (id=${req.params.id})`);
  resourceController.getResourceById(req, res, next);
});

router.get('/resource', (req, res, next) => {
  console.log(`📋 GET /resource 매칭됨`);
  resourceController.getAllResources(req, res, next);
});

router.post('/resource', resourceController.createResource);
router.patch('/resource/:id', (req, res, next) => {
  console.log(`✏️ PATCH /resource/:id 매칭됨 (id=${req.params.id})`);
  resourceController.updateResource(req, res, next);
});

router.delete('/resource/:id', (req, res, next) => {
  console.log(`🗑️ DELETE /resource/:id 매칭됨 (id=${req.params.id})`);
  resourceController.deleteResource(req, res, next);
});

module.exports = router;
