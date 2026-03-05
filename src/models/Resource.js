const mongoose = require('mongoose');

// Resource Characteristic Schema (확장 가능한 속성)
const characteristicSchema = new mongoose.Schema({
  name: String,
  value: mongoose.Schema.Types.Mixed,
  valueType: String
}, { _id: false });

// Place Schema (위치 정보)
const placeSchema = new mongoose.Schema({
  id: String,
  name: String,
  role: String
}, { _id: false });

// Resource Specification Reference
const resourceSpecificationSchema = new mongoose.Schema({
  id: String,
  href: String,
  name: String
}, { _id: false });

// Resource Relationship Schema
const resourceRelationshipSchema = new mongoose.Schema({
  id: String,
  relationshipType: {
    type: String,
    enum: ['contains', 'connectedTo', 'dependsOn'],
    required: true
  },
  resource: {
    id: String,
    href: String,
    name: String
  }
}, { _id: false });

// Main Resource Schema
const resourceSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  href: String,
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Physical', 'Logical'],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['Router', 'Switch', 'BTS', 'OLT', 'IP', 'VLAN', 'Circuit', 'Equipment'],
    required: true
  },
  operationalState: {
    type: String,
    enum: ['enable', 'disable'],
    default: 'enable'
  },
  administrativeState: {
    type: String,
    enum: ['locked', 'unlocked', 'shuttingDown'],
    default: 'unlocked'
  },
  usageState: {
    type: String,
    enum: ['idle', 'active', 'busy'],
    default: 'idle'
  },
  lifecycleState: {
    type: String,
    enum: ['planning', 'installing', 'operating', 'retiring'],
    default: 'operating'
  },
  place: placeSchema,
  resourceSpecification: resourceSpecificationSchema,
  resourceRelationship: [resourceRelationshipSchema],
  characteristic: [characteristicSchema],
  '@type': {
    type: String,
    default: 'Resource'
  },
  '@baseType': String,
  '@schemaLocation': String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastModifiedDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
resourceSchema.index({ resourceType: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ lifecycleState: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
