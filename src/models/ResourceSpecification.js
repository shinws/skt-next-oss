const mongoose = require('mongoose');

// Resource Specification Characteristic Schema
const specCharacteristicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  valueType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array', 'object'],
    default: 'string'
  },
  minValue: mongoose.Schema.Types.Mixed,
  maxValue: mongoose.Schema.Types.Mixed,
  isOptional: {
    type: Boolean,
    default: false
  },
  allowedValues: [mongoose.Schema.Types.Mixed]
}, { _id: false });

// Main ResourceSpecification Schema
const resourceSpecificationSchema = new mongoose.Schema({
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
  version: {
    type: String,
    default: '1.0.0'
  },
  isBundle: {
    type: Boolean,
    default: false
  },
  resourceSpecCharacteristic: [specCharacteristicSchema],
  '@type': {
    type: String,
    default: 'ResourceSpecification'
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
resourceSpecificationSchema.index({ name: 1 });
resourceSpecificationSchema.index({ version: 1 });

module.exports = mongoose.model('ResourceSpecification', resourceSpecificationSchema);
