/**
 * Excel to Resource Mapper
 * Converts Excel rows (46 columns) to Resource objects
 * Maps 11 standard TMF639 fields + 35 characteristic fields
 */

const crypto = require('crypto');

/**
 * Standard field mapping: Excel column header → Resource field
 */
const STANDARD_FIELD_MAPPING = {
  '장비명': 'name',           // Required
  '비고': 'description',
  '운영 구분': 'operationalState',
  '서버 가동 상태': 'usageState',
  '영역 그룹': 'place.name',
  '설치국사': 'place.role',
  '관리 ID': 'place.id',
};

/**
 * All 46 Excel column headers
 * (Used to identify characteristic fields)
 */
const ALL_EXCEL_HEADERS = [
  '수정여부', '순번', '영역 그룹', '영역 구분', '영역 세부 구분',
  '관리 ID', 'TANGO 장비 ID', '장비명', 'Hostname', '운영 구분',
  '서버 가동 상태', 'OS분류', 'OS명', 'OS Version', 'OS Kernel 버전',
  'EDR 대상', 'EDR 설치 여부', 'EDR 설치 일자', 'EDR 설치 제품', 'EDR DeviceID/UUID',
  'EDR Detection On', 'EDR Full Scan 여부', 'EDR 미설치 사유', 'IP', '설치국사',
  '상면위치', '가상화 장비 유무', 'H/W 제조사', 'H/W 모델명', 'SIMS수집일자',
  '웹서비스 유무', 'SKT 운용부서', 'SKT 담당자', '변경 대상 부서', '변경 운용 담당자',
  'HW 유지보수BP', 'HW BP 담당자', '장비 도입일자', '관리자산 포함일', '6월 제출여부',
  '6월 운영구분', '6월 영역구분', '6월 EDR 대상', '6월 EDR 설치예외사유', '작성팀'
];

/**
 * Characteristics fields: columns that go into characteristic array
 * (Excluding standard mapped fields)
 */
const CHARACTERISTIC_FIELDS = ALL_EXCEL_HEADERS.filter(
  header => !Object.keys(STANDARD_FIELD_MAPPING).includes(header)
);

/**
 * Generate unique resource ID
 * Format: res-{timestamp}-{randomHash}
 * @returns {string} Unique resource ID
 */
function generateResourceId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').substring(0, 8);
  return `res-${timestamp}-${random}`;
}

/**
 * Infer value type from content
 * Returns: 'string', 'number', 'date', 'boolean'
 * @param {*} value - Value to analyze
 * @returns {string} Inferred type
 */
function inferValueType(value) {
  if (value === null || value === undefined || value === '') {
    return 'string';
  }

  // Boolean check
  if (typeof value === 'boolean' || value === true || value === false) {
    return 'boolean';
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    if (['yes', 'no', 'y', 'n', 'true', 'false'].includes(lowerValue)) {
      return 'boolean';
    }
  }

  // Number check
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!isNaN(trimmed) && trimmed !== '') {
      return 'number';
    }
  }

  // Date check
  if (value instanceof Date) {
    return 'date';
  }
  if (typeof value === 'string') {
    // Common date patterns
    const datePatterns = [
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/,  // MM/DD/YYYY or DD-MM-YYYY
      /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,    // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2}T/,                // ISO 8601
    ];
    if (datePatterns.some(pattern => pattern.test(value))) {
      return 'date';
    }
  }

  // Default to string
  return 'string';
}

/**
 * Convert characteristic value based on type
 * @param {*} value - Original value
 * @param {string} type - Target type
 * @returns {*} Converted value
 */
function convertValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (type) {
    case 'number':
      return isNaN(value) ? value : Number(value);

    case 'boolean':
      if (typeof value === 'boolean') return value;
      const strVal = String(value).toLowerCase().trim();
      return ['yes', 'y', 'true', '1'].includes(strVal);

    case 'date':
      if (value instanceof Date) return value.toISOString();
      return new Date(value).toISOString();

    case 'string':
    default:
      return String(value).trim();
  }
}

/**
 * Infer category (Physical or Logical) based on resource data
 * @param {object} row - Excel row data
 * @returns {string} 'Physical' or 'Logical'
 */
function inferCategory(row) {
  // Check OS-related fields → Logical
  const osFields = ['OS분류', 'OS명', 'OS Version', 'OS Kernel 버전', 'IP', 'Hostname'];
  if (osFields.some(field => row[field])) {
    return 'Logical';
  }

  // Check Hardware fields → Physical
  const hwFields = ['H/W 제조사', 'H/W 모델명', '상면위치', 'SIMS수집일자'];
  if (hwFields.some(field => row[field])) {
    return 'Physical';
  }

  // Default to Physical
  return 'Physical';
}

/**
 * Map Excel row to Resource object
 * @param {object} row - Excel row data (header → value)
 * @param {number} rowIndex - Row number (for error tracking)
 * @returns {object} { resource, errors: [] }
 */
function mapExcelRowToResource(row, rowIndex) {
  const errors = [];

  // 장비명이 없으면 생략 (해당 행 전체 스킵)
  const equipmentName = row['장비명'] ? String(row['장비명']).trim() : '';
  if (!equipmentName) {
    return {
      resource: null,
      errors: [{ field: '장비명', error: 'Required field missing - row skipped' }]
    };
  }

  // resourceType 유효성 검사 및 기본값
  let resourceType = 'Equipment';
  const validResourceTypes = ['Router', 'Switch', 'BTS', 'OLT', 'IP', 'VLAN', 'Circuit', 'Equipment'];
  const rawType = row['장비명'] ? String(row['장비명']).substring(0, 20) : 'Equipment';

  // 장비명에서 타입 추론 (예: "Router-A" → "Router")
  if (rawType.includes('Router')) resourceType = 'Router';
  else if (rawType.includes('Switch')) resourceType = 'Switch';
  else if (rawType.includes('BTS')) resourceType = 'BTS';
  else if (rawType.includes('OLT')) resourceType = 'OLT';
  else if (rawType.includes('IP') || row['IP']) resourceType = 'IP';
  else if (rawType.includes('VLAN')) resourceType = 'VLAN';
  else if (rawType.includes('Circuit')) resourceType = 'Circuit';
  else resourceType = 'Equipment'; // 기본값

  const resource = {
    id: generateResourceId(),
    href: null, // Will be set by API after creation
    name: equipmentName,
    description: row['비고'] ? String(row['비고']).trim() : '(No description)',
    category: inferCategory(row),
    resourceType: resourceType,
    operationalState: normalizeOperationalState(row['운영 구분']),
    administrativeState: 'unlocked',
    usageState: normalizeUsageState(row['서버 가동 상태']),
    lifecycleState: 'operating',
    place: {
      id: row['관리 ID'] ? String(row['관리 ID']).trim() : '',
      name: row['영역 그룹'] ? String(row['영역 그룹']).trim() : '',
      role: row['설치국사'] ? String(row['설치국사']).trim() : '',
    },
    resourceSpecification: {
      id: '',
      href: '',
      name: '',
    },
    resourceRelationship: [],
    characteristic: [],
    '@type': 'Resource',
    '@baseType': 'Resource',
  };

  // Map characteristic fields (all non-standard columns)
  CHARACTERISTIC_FIELDS.forEach(fieldName => {
    const value = row[fieldName];
    if (value !== null && value !== undefined && value !== '') {
      const valueType = inferValueType(value);
      const convertedValue = convertValue(value, valueType);

      resource.characteristic.push({
        name: fieldName,
        value: convertedValue,
        valueType,
      });
    }
  });

  return { resource, errors };
}

/**
 * Normalize operational state values
 * @param {string} value - Raw value from Excel
 * @returns {string} Normalized state (enable/disable)
 */
function normalizeOperationalState(value) {
  if (!value) return 'enable';

  const normalized = String(value).toLowerCase().trim();
  if (normalized.includes('disable') || normalized === '차단') {
    return 'disable';
  }
  return 'enable';
}

/**
 * Normalize usage state values
 * @param {string} value - Raw value from Excel
 * @returns {string} Normalized state (idle/active/busy)
 */
function normalizeUsageState(value) {
  if (!value) return 'idle';

  const normalized = String(value).toLowerCase().trim();
  if (normalized.includes('busy') || normalized === '혼잡') {
    return 'busy';
  }
  if (normalized.includes('active') || normalized === '운영' || normalized === '동작') {
    return 'active';
  }
  return 'idle';
}

/**
 * Parse Excel file and convert to Resource objects
 * @param {Buffer} fileBuffer - Excel file buffer
 * @param {object} xlsx - xlsx library instance
 * @returns {object} { resources: [], headers: [], errors: [] }
 */
function parseExcelFile(fileBuffer, xlsx) {
  try {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return {
        resources: [],
        headers: [],
        errors: [{ row: 0, error: 'No sheets found in Excel file' }],
      };
    }

    const worksheet = workbook.Sheets[sheetName];

    // Parse to JSON with headers
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return {
        resources: [],
        headers: [],
        errors: [{ row: 0, error: 'No data rows found in Excel file' }],
      };
    }

    // Extract headers from first row
    const headers = Object.keys(data[0]);

    // Map each row to Resource
    const resources = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel is 1-indexed and includes header
      const { resource, errors: rowErrors } = mapExcelRowToResource(row, rowNumber);

      if (rowErrors.length > 0) {
        rowErrors.forEach(err => {
          errors.push({
            row: rowNumber,
            field: err.field,
            error: err.error,
          });
        });
      }

      // 유효한 자원만 추가 (null이 아닌 경우)
      if (resource) {
        resources.push(resource);
      }
    });

    return { resources, headers, errors };
  } catch (error) {
    return {
      resources: [],
      headers: [],
      errors: [{ row: 0, error: `Failed to parse Excel: ${error.message}` }],
    };
  }
}

/**
 * Validate resources for MongoDB insertion
 * @param {array} resources - Array of Resource objects
 * @returns {object} { valid: [], invalid: [] }
 */
function validateResources(resources) {
  const valid = [];
  const invalid = [];

  const uniqueIds = new Set();

  resources.forEach((resource, index) => {
    const errors = [];

    // Check required fields
    if (!resource.name || resource.name.trim() === '') {
      errors.push('Missing required field: name');
    }

    // Check for duplicate IDs
    if (uniqueIds.has(resource.id)) {
      errors.push(`Duplicate resource ID: ${resource.id}`);
    } else {
      uniqueIds.add(resource.id);
    }

    // Check category enum
    if (!['Physical', 'Logical'].includes(resource.category)) {
      errors.push(`Invalid category: ${resource.category}`);
    }

    if (errors.length > 0) {
      invalid.push({
        index,
        resource,
        errors,
      });
    } else {
      valid.push(resource);
    }
  });

  return { valid, invalid };
}

module.exports = {
  generateResourceId,
  inferValueType,
  inferCategory,
  mapExcelRowToResource,
  parseExcelFile,
  validateResources,
  STANDARD_FIELD_MAPPING,
  CHARACTERISTIC_FIELDS,
  ALL_EXCEL_HEADERS,
};
