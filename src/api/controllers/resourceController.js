const Resource = require('../../models/Resource');
const excelMapper = require('../../utils/excelMapper');
const xlsx = require('xlsx');

// GET /resource - 모든 자원 조회
exports.getAllResources = async (req, res) => {
  try {
    const { offset = 0, limit = 10, resourceType, lifecycleState, fields } = req.query;

    // 필터 조건 구성
    const filter = {};
    if (resourceType) filter.resourceType = resourceType;
    if (lifecycleState) filter.lifecycleState = lifecycleState;

    // 페이징 및 필터 적용
    const resources = await Resource.find(filter)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    const total = await Resource.countDocuments(filter);

    res.status(200).json({
      data: resources,
      offset: parseInt(offset),
      limit: parseInt(limit),
      total,
      '@type': 'ResourceList'
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /resource/:id - 특정 자원 조회
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID 필드로 조회 (MongoDB _id가 아닌 커스텀 id 필드)
    const resource = await Resource.findOne({ id });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(200).json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /resource - 자원 생성
exports.createResource = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      resourceType,
      operationalState,
      administrativeState,
      usageState,
      lifecycleState,
      place,
      resourceSpecification,
      resourceRelationship,
      characteristic
    } = req.body;

    // ID 생성 (자동)
    const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Auto-infer resourceType if not provided (match Excel mapper + form logic)
    let inferredType = resourceType;
    if (!inferredType || inferredType === '') {
      const nameUpper = String(name).toUpperCase();
      if (nameUpper.includes('ROUTER')) inferredType = 'Router';
      else if (nameUpper.includes('SWITCH')) inferredType = 'Switch';
      else if (nameUpper.includes('BTS')) inferredType = 'BTS';
      else if (nameUpper.includes('OLT')) inferredType = 'OLT';
      else if (nameUpper.includes('IP')) inferredType = 'IP';
      else if (nameUpper.includes('VLAN')) inferredType = 'VLAN';
      else if (nameUpper.includes('CIRCUIT')) inferredType = 'Circuit';
      else inferredType = 'Equipment'; // Default
    }

    const newResource = new Resource({
      id,
      href: `/tmf-api/resourceInventoryManagement/v4/resource/${id}`,
      name,
      description,
      category,
      resourceType: inferredType,
      operationalState: operationalState || 'enable',
      administrativeState: administrativeState || 'unlocked',
      usageState: usageState || 'idle',
      lifecycleState: lifecycleState || 'operating',
      place,
      resourceSpecification,
      resourceRelationship: resourceRelationship || [],
      characteristic: characteristic || []
    });

    const savedResource = await newResource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH /resource/:id - 자원 수정
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // lastModifiedDate 자동 업데이트
    updates.lastModifiedDate = new Date();

    const updatedResource = await Resource.findOneAndUpdate({ id }, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /resource/:id - 자원 삭제
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedResource = await Resource.findOneAndDelete({ id });

    if (!deletedResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /resource/import - Excel 파일에서 대량 임포트
exports.importFromExcel = async (req, res) => {
  const startTime = Date.now();

  try {
    // 파일 검증
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    console.log(`📁 Excel import started: ${req.file.originalname}`);

    // Excel 파일 파싱
    const { resources, headers, errors: parseErrors } = excelMapper.parseExcelFile(
      req.file.buffer,
      xlsx
    );

    if (resources.length === 0 && parseErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Failed to parse Excel file',
        errors: parseErrors,
      });
    }

    console.log(`✅ Parsed ${resources.length} resources from Excel`);

    // 유효성 검사
    const { valid, invalid } = excelMapper.validateResources(resources);

    console.log(`✓ ${valid.length} valid, ✗ ${invalid.length} invalid resources`);

    // 유효한 자원들을 MongoDB에 저장 (부분 성공 지원)
    const importedIds = [];
    const failureDetails = [];

    for (const resource of valid) {
      try {
        const newResource = new Resource(resource);
        const savedResource = await newResource.save();
        importedIds.push(savedResource.id);
      } catch (error) {
        failureDetails.push({
          resourceId: resource.id,
          resourceName: resource.name,
          error: error.message,
        });
      }
    }

    // 검증 실패한 자원 추가
    invalid.forEach((item) => {
      failureDetails.push({
        rowIndex: item.index,
        resourceName: item.resource.name,
        errors: item.errors,
      });
    });

    // 파싱 에러 추가
    const allErrors = [
      ...parseErrors,
      ...failureDetails.map((f) => ({
        row: f.rowIndex || f.resourceId,
        error: Array.isArray(f.errors) ? f.errors.join('; ') : f.error,
      })),
    ];

    const processingTime = Date.now() - startTime;
    const totalFailed = invalid.length + failureDetails.filter(f => !f.rowIndex).length;

    console.log(`
🎉 Excel import completed:
  - Imported: ${importedIds.length}
  - Failed: ${totalFailed}
  - Processing time: ${processingTime}ms
    `);

    res.status(200).json({
      success: true,
      imported: importedIds.length,
      failed: totalFailed,
      warnings: parseErrors.length,
      errors: allErrors.slice(0, 100), // Max 100 errors in response
      importedIds,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error importing Excel:', error);
    const processingTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      error: `Failed to import Excel: ${error.message}`,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  }
};
