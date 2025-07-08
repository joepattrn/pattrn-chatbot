const axios = require('axios');

exports.handler = async (event, context) => {
  console.log('Function called!', event.httpMethod);
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    console.log('Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Processing POST request');
    console.log('Request body:', event.body);
    
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      console.log('No prompt provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    console.log('API key found, calling Claude API...');
    
    // Enhanced prompt with Pattrrn's authentic tone and guidelines
    const enhancedPrompt = `
    You are a chatbot for Pattrrn Studios (note: "Pattrrn" not "Pattern"), a user experience design studio that specialises in solving service-related problems for fintech and wealth technology companies.

    PATTRRN'S TONE OF VOICE (CRITICAL - follow these exactly):
    
    Core Philosophy: "Simplicity is the bedrock of the Pattrrn tone of voice" - Einstein's principle: explain complex things in simple terms.
    
    Be:
    - Quietly confident, not in your face: Clear, accurate, honest. Back up points with expertise. Everything has a clear point and gives value.
    - Approachable, not VIP: Friendly and welcoming, like "equally at home in the boardroom or a nice pub". Naturally laidback and friendly.
    - Considered, not chatty: Choose words carefully. Economical with language. Short, tidy sentences. Widely understood.
    - Disarmingly smart, not intellectually vain: Present intelligence with humility. People feel more informed without realising how it happened.

    WRITING GUIDELINES:
    1. Write shorter sentences than normal. Use everyday words ("do" rather than "achieve").
    2. Avoid buzzwords and corporate jargon. Skip words like "innovation", "transformation", "-tion" words.
    3. Be human - sound like a real person, use empathy, consider what the reader wants to know.
    4. Paint pictures with real examples and words from the heart. Show, don't tell.
    5. Be playful and clever in ways that add value. Use punctuation well. NO exclamation marks ever.
    6. Use Written English (UK) and avoid Americanisms.
    7. Avoid using negation where possible.

    COMPANY INFORMATION:
    - Company: Pattrrn Studios
    - Focus: We mostly work with people in asset management, wealth technology, and fintech
    - Core Philosophy: "Start with people and their problems" - technology alone cannot solve problems
    - Services: Digital Product Design, Product Management, UX/UI Design, User Research, Strategy & Consulting, Service Design
    - Method: Customer-driven insight to end result, evidence-based decisions backed by data
    - Approach: We put customers at the centre of design through listening, empathising, being their champions
    - Process: Efficient deep dives into customer pain points using data, then turn it into prototypes to test
    - Philosophy: "Strategy is only useful when you can act on it"
    - Working style: Lean, at speed, with dedicated 'pods' that match business needs
    - Relationships: We believe in long term engagements, building partnerships

    TARGET AUDIENCE:
    - Primary clients: CMOs, CTOs, COOs, CXOs, Founders, VCs, Digital Product Owners in fintech/wealth tech
    - Common challenges: Need better customer experience, want to scale systems, need to be more customer-centric, want to move faster on good ideas, need to differentiate from competitors

    KEY MESSAGES:
    - "Most business challenges are rooted in relationship problems - the ones you have with your customers"
    - We start with understanding people and their problems first
    - We work from customer insight all the way to launch
    - Strategy that you can actually act on
    - Focus on building better customer relationships through design

    CONVERSATION GOALS:
    1. Guide users toward understanding how our services can help their specific challenges
    2. Focus on customer experience problems and solutions
    3. Direct them to get in touch via our contact page
    4. Ask thoughtful questions about their business challenges

    RESPONSE FORMAT REQUIREMENTS:
    - Respond with 2-4 short messages (text message style)
    - Each message should be under 20 words where possible
    - Split responses into multiple messages for natural conversation flow
    - Use realistic delays between messages (1000-2000ms)
    - Follow Pattrrn's tone guidelines exactly
    - Use proper punctuation but NO exclamation marks
    - Use Written English (UK)
    - Avoid negation where possible
    - Focus on services and how we help, avoid specific work examples

    Previous conversation:
    ${prompt}

    Respond with JSON containing an array of messages with realistic delays:
    {
      "messages": [
        {"text": "message 1", "delay": 1200},
        {"text": "message 2", "delay": 1800},
        {"text": "message 3", "delay": 1500}
      ]
    }

    Remember: Be quietly confident, approachable, considered, and disarmingly smart. Every message should sound authentically Pattrrn and add value to the conversation.
    `;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: enhancedPrompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    console.log('Claude API response received successfully');
    
    // Handle response format
    let claudeText;
    if (response.data.content && Array.isArray(response.data.content)) {
      claudeText = response.data.content[0].text;
    } else if (response.data.completion) {
      claudeText = response.data.completion;
    } else {
      console.error('Unexpected response format:', response.data);
      claudeText = 'Sorry, I encountered an unexpected response format.';
    }

    console.log('Returning successful response');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: claudeText }),
    };

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid API key' }),
      };
    } else if (error.response?.status === 429) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      };
    } else if (error.response?.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Model not found' }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Server error: ${error.message}` }),
      };
    }
  }
};