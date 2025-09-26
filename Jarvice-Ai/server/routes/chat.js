const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Send message to chatbot
router.post('/send', [
  authenticateToken,
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const userId = req.user.id;

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(message);

    // Store conversation in database
    await pool.query(
      'INSERT INTO chats (user_id, message, response) VALUES ($1, $2, $3)',
      [userId, message, geminiResponse]
    );

    res.json({
      message: 'Message sent successfully',
      response: geminiResponse
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, message, response, timestamp 
       FROM chats 
       WHERE user_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM chats WHERE user_id = $1',
      [userId]
    );

    res.json({
      chats: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.rows[0].count),
        pages: Math.ceil(totalResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Clear chat history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query('DELETE FROM chats WHERE user_id = $1', [userId]);

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

// Call Gemini API
const callGeminiAPI = async (message) => {
  try {
    const response = await axios.post(
      `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are Jarvice AI, an intelligent assistant specialized in interview preparation and career guidance. 
                   You help users with:
                   - Interview questions and answers
                   - Resume and CV advice
                   - Career development tips
                   - Mock interview practice
                   - Industry-specific guidance
                   
                   Be helpful, professional, and encouraging. Keep responses concise but informative.
                   
                   User message: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    if (error.response) {
      console.error('API Response:', error.response.data);
      throw new Error(`Gemini API error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.request) {
      throw new Error('Failed to connect to Gemini API');
    } else {
      throw new Error('Error calling Gemini API');
    }
  }
};

module.exports = router;
