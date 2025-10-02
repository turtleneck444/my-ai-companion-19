const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve API files from the api directory
app.use('/api', express.static(path.join(__dirname, 'api')));

// Import and use the API handlers
const openaiChat = require('./api/openai-chat.js');
const elevenlabsTts = require('./api/elevenlabs-tts.js');
const generateImage = require('./api/generate-image.js');
const payments = require('./api/payments.js');

app.post('/api/openai-chat', openaiChat);
app.post('/api/elevenlabs-tts', elevenlabsTts);
app.post('/api/generate-image', generateImage);
app.post('/api/payments', payments);

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/openai-chat`);
  console.log(`   POST /api/elevenlabs-tts`);
  console.log(`   POST /api/generate-image`);
  console.log(`   POST /api/payments`);
}); 