// Test OpenAI API connection and query generation
require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('Testing OpenAI API...');
  console.log('Model:', process.env.OPENAI_MODEL || 'gpt-4o-mini');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Test 1: Simple completion
    console.log('\n1. Testing simple completion...');
    const response1 = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "Hello World"' }
      ],
      max_completion_tokens: 1000,
    });
    console.log('Full response:', JSON.stringify(response1, null, 2));
    console.log('Content:', response1.choices[0]?.message?.content || 'NO CONTENT');

    // Test 2: JSON generation without response_format
    console.log('\n2. Testing JSON generation...');
    const response2 = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { 
          role: 'user', 
          content: 'Return a JSON object with a "queries" array containing 3 search queries for finding Iohexol suppliers. Format: {"queries": ["q1", "q2", "q3"]}' 
        }
      ],
      max_completion_tokens: 2000,
    });
    console.log('Choice object:', JSON.stringify(response2.choices[0], null, 2));
    console.log('Content:', response2.choices[0]?.message?.content || 'NO CONTENT');

    // Test 3: With system message
    console.log('\n3. Testing with system message...');
    const response3 = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a search query generator. Always return valid JSON.' 
        },
        { 
          role: 'user', 
          content: 'Generate 3 search queries for finding Iohexol pharmaceutical suppliers. Return as {"queries": [...]}' 
        }
      ],
      max_completion_tokens: 2000,
    });
    console.log('Content:', response3.choices[0]?.message?.content || 'NO CONTENT');
    
    // Test 4: Check finish reason
    console.log('\n4. Checking finish reasons...');
    console.log('Response 1 finish reason:', response1.choices[0]?.finish_reason);
    console.log('Response 2 finish reason:', response2.choices[0]?.finish_reason);
    console.log('Response 3 finish reason:', response3.choices[0]?.finish_reason);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testOpenAI();