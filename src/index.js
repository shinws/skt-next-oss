const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const swaggerUI = require('swagger-ui-express');
const yaml = require('yaml');
const fs = require('fs');

// App Configuration
const app = express();
const PORT = process.env.PORT || 8081;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resource-inventory';

// Load Swagger specification
let swaggerDocs = {};
try {
  const swaggerFile = fs.readFileSync(path.join(__dirname, './openapi/swagger.yaml'), 'utf-8');
  swaggerDocs = yaml.parse(swaggerFile);
} catch (err) {
  console.warn('⚠️  Warning: Could not load Swagger spec:', err.message);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static File Serving for UI
app.use('/ui', express.static(path.join(__dirname, '../ui')));

// Root path redirect to UI
app.get('/', (req, res) => {
  res.redirect('/ui');
});

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Swagger UI Endpoint
if (Object.keys(swaggerDocs).length > 0) {
  app.use(
    '/api-docs',
    swaggerUI.serve,
    swaggerUI.setup(swaggerDocs, {
      swaggerOptions: {
        url: '/api-docs.json'
      }
    })
  );

  // OpenAPI JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
  });

  console.log('✅ Swagger UI available at /api-docs');
} else {
  console.warn('⚠️  Warning: Swagger UI not available (spec not loaded)');
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'ODA Resource Inventory Component is running'
  });
});

// API Routes
const resourceRoutes = require('./api/routes/resource');
app.use('/tmf-api/resourceInventoryManagement/v4', resourceRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB URI: ${MONGODB_URI}`);
});

module.exports = app;
