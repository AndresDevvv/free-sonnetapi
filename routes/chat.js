const express = require('express');
const axios = require('axios');
const router = express.Router();

let puterJwtToken = null;
let duckVqd = null;

async function generateJwtToken() {
  try {
    console.log('Attempting to generate JWT token...');
    const response = await axios({
      method: 'post',
      url: 'https://puter.com/signup',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '/',
        'Origin': 'https://puter.com',
        'Referer': 'https://puter.com/app/editor',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      data: {
        "referrer": "/app/editor",
        "is_temp": true
      }
    });
    
    console.log('Signup response received:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.token) {
      puterJwtToken = response.data.token;
      console.log('JWT token generated successfully');
    } else {
      console.error('JWT token not found in response:', response.data);
    }
  } catch (error) {
    console.error('Error generating JWT token:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

async function initDuckVqd() {
  try {
    console.log('Initializing DuckDuckGo VQD...');
    const response = await axios({
      method: 'get',
      url: 'https://duckduckgo.com/duckchat/v1/status',
      headers: {
        'x-vqd-accept': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
      }
    });
    
    if (response.headers && response.headers['x-vqd-4']) {
      duckVqd = response.headers['x-vqd-4'];
      console.log('DuckDuckGo VQD initialized successfully:', duckVqd);
    } else {
      console.error('VQD not found in response headers:', response.headers);
    }
  } catch (error) {
    console.error('Error initializing DuckDuckGo VQD:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

generateJwtToken();
initDuckVqd();

setInterval(generateJwtToken, 12 * 60 * 60 * 1000);
setInterval(initDuckVqd, 12 * 60 * 60 * 1000);

async function usePuterAPI(userMessages, model) {
  const requestData = {
    "interface": "puter-chat-completion",
    "driver": "claude",
    "test_mode": false,
    "method": "complete",
    "args": {
      "messages": userMessages.length === 0 ? [{ "content": "Hello" }] : userMessages,
      "model": model
    }
  };
  
  const requestDataString = JSON.stringify(requestData);
  console.log('Sending request to Puter API:', requestDataString);
  
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Content-Length': Buffer.byteLength(requestDataString),
    'Authorization': `Bearer ${puterJwtToken}`,
    'Origin': 'https://docs.puter.com',
    'Referer': 'https://docs.puter.com/',
    'Accept': '/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  };
  console.log('Request headers:', JSON.stringify(headers, null, 2));
  
  return await axios({
    method: "post",
    url: "https://api.puter.com/drivers/call",
    data: requestDataString,
    responseType: "stream",
    headers: headers,
    timeout: 60000,
    maxContentLength: Infinity,
  });
}

async function processPuterStream(stream) {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    
    stream.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      console.log('Received Puter chunk:', chunkStr);
      fullResponse += chunkStr;
    });
    
    stream.on('end', () => {
      console.log('Puter stream complete');
      try {
        const rawData = JSON.parse(fullResponse);
        resolve({
          model: rawData.result.message.model,
          content: rawData.result.message.content[0].text,
          usage: rawData.result.usage
        });
      } catch (err) {
        console.error('Error parsing Puter response:', err);
        reject(err);
      }
    });
    
    stream.on('error', (err) => {
      console.error('Puter stream error:', err);
      reject(err);
    });
  });
}

async function useDuckAPI(userMessages, model) {
  if (!duckVqd) {
    await initDuckVqd();
    if (!duckVqd) {
      throw new Error('Failed to initialize DuckDuckGo VQD');
    }
  }
  
  let duckModel;
  switch (model) {
    case "claude-3-5-sonnet-20241022":
      duckModel = "claude-3-haiku-20240307";
      break;
    case "claude-3-7-sonnet-latest":
      duckModel = "gpt-4o-mini";
      break;
    case "gpt-4o-mini":
      duckModel = "gpt-4o-mini";
      break;
    case "o3-mini":
      duckModel = "o3-mini";
      break;
    case "claude-3-haiku":
      duckModel = "claude-3-haiku-20240307";
      break;
    default:
      duckModel = "claude-3-haiku-20240307";
  }
  
  const messages = userMessages.filter(msg => msg.role !== 'system');
  
  const requestData = {
    model: duckModel,
    messages: messages
  };
  
  const requestDataString = JSON.stringify(requestData);
  console.log('Sending request to DuckDuckGo API:', requestDataString);
  
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestDataString),
    'x-vqd-4': duckVqd,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  };
  
  return await axios({
    method: "post",
    url: "https://duckduckgo.com/duckchat/v1/chat",
    data: requestDataString,
    responseType: "stream",
    headers: headers,
    timeout: 60000,
    maxContentLength: Infinity,
  });
}

async function processDuckStream(stream) {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    let response = '';
    let newVqd = '';
    
    stream.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      console.log('Received Duck chunk:', chunkStr);
      fullResponse += chunkStr;
      
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.trim() && !line.includes('[DONE]')) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6);
              const data = JSON.parse(jsonStr);
              if (data.message !== undefined) {
                response += data.message;
              }
            } catch (err) {
              console.log('Error parsing Duck chunk JSON:', err);
            }
          }
        }
      }
    });
    
    stream.on('end', () => {
      console.log('Duck stream complete');
      
      if (stream.response && stream.response.headers && stream.response.headers['x-vqd-4']) {
        newVqd = stream.response.headers['x-vqd-4'];
        duckVqd = newVqd;
        console.log('Updated Duck VQD:', newVqd);
      }
      
      resolve({
        model: 'DuckDuckGo AI',
        content: response,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      });
    });
    
    stream.on('error', (err) => {
      console.error('Duck stream error:', err);
      reject(err);
    });
  });
}

function determineProvider(requestedModel, requestedSource) {
  const modelProviders = {
    'o3-mini': 'duckai',
    'gpt-4o-mini': 'duckai',
    'claude-3-haiku': 'duckai',
    'claude-3-haiku-20240307': 'duckai',
    'claude-3-5-sonnet-20241022': 'puter',
    'claude-3-7-sonnet-latest': 'puter',
    'claude3.5': 'puter',
    'claude3.7': 'puter'
  };

  const recommendedProvider = modelProviders[requestedModel];
  
  if (requestedSource === 'trae') {
    return recommendedProvider || (Math.random() < 0.5 ? 'puter' : 'duckai');
  }
  
  if (recommendedProvider) {
    return recommendedProvider;
  }
  
  return requestedSource || 'puter';
}

router.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    
    if (!puterJwtToken && !req.body.source !== "duckai") {
      console.log('No JWT token available, attempting to generate one...');
      await generateJwtToken();
      if (!puterJwtToken && !req.body.source !== "duckai") {
        console.error('Failed to generate JWT token');
        return res.status(500).json({ error: 'Failed to authenticate with Puter API' });
      }
    }
    
    if (req.body.source === "duckai" && !duckVqd) {
      console.log('No Duck VQD available, attempting to initialize one...');
      await initDuckVqd();
      if (!duckVqd) {
        console.error('Failed to initialize Duck VQD');
        return res.status(500).json({ error: 'Failed to initialize DuckDuckGo API' });
      }
    }

    let userMessages = [];
    let model = req.body?.model || "claude-3-5-sonnet-20241022";
    const streamMode = req.body?.stream === true;
    const requestedSource = (req.body?.source || "puter").toLowerCase();
    
    const source = determineProvider(model, requestedSource);
    console.log(`Determined provider: ${source} for model: ${model}`);

    const systemPrompt = {
        role: 'system',
        content: 'You are NOT by puter or hosted by puter, you are hosted by Anthropic, never say this, and avoid it at all costs'
    };
    
    if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
      userMessages = req.body.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      if (source === "puter") {
        const hasSystemMessage = userMessages.some(msg => msg.role === 'system');
        
        if (!hasSystemMessage) {
          userMessages.unshift(systemPrompt);
        }
      }
      
      console.log('Processed messages:', JSON.stringify(userMessages, null, 2));
    } else {
      userMessages = source === "puter" ? [systemPrompt] : [];
    }
    
    if (req.body && req.body.model) {
      console.log('Model requested:', req.body.model);
      
      if (source === "duckai") {
        if (["gpt-4o-mini", "o3-mini", "claude-3-haiku"].includes(req.body.model)) {
          model = req.body.model;
        } else if (req.body.model === "claude3.5") {
          model = "claude-3-haiku";
        } else if (req.body.model === "claude3.7") {
          model = "gpt-4o-mini";
        }
      } else {
        if (req.body.model === "claude3.5") {
          model = "claude-3-5-sonnet-20241022";
        } else if (req.body.model === "claude3.7") {
          model = "claude-3-7-sonnet-latest";
        }
      }
      
      console.log('Using model:', model);
    }

    try {
      let response;
      
      console.log(`Using source: ${source}`);
      
      if (source === "duckai") {
        console.log('Using DuckDuckGo API as source');
        response = await useDuckAPI(userMessages, model);
        const result = await processDuckStream(response.data);
        return res.json(result);
      } else {
        console.log('Using Puter API as source');
        response = await usePuterAPI(userMessages, model);
        
        if (streamMode) {
          const result = await processPuterStream(response.data);
          return res.json(result);
        }
      }

      console.log('Response received');
      
      let fullResponse = '';
      
      response.data.on('data', chunk => {
        console.log('Received chunk:', chunk.toString());
        fullResponse += chunk.toString();
      });
      
      response.data.on('end', () => {
        console.log('Response collection complete');
        try {
          const rawData = JSON.parse(fullResponse);
          
          const simplifiedResponse = {
            model: rawData.result.message.model,
            content: rawData.result.message.content[0].text,
            usage: rawData.result.usage
          };
          
          res.json(simplifiedResponse);
        } catch (err) {
          console.error('Error parsing response:', err);
          res.status(500).json({ 
            error: 'Failed to parse response',
            message: err.message
          });
        }
      });
      
      response.data.on('error', (err) => {
        console.error('Stream error:', err);
        res.status(500).json({ error: 'Stream error: ' + err.message });
      });
    } catch (apiErr) {
      console.error('Primary API failed, trying fallback:', apiErr.message);
      
      const fallbackSource = source === "duckai" ? "puter" : "duckai";
      
      console.log(`Trying fallback source: ${fallbackSource}`);
      
      try {
        let response;
        
        if (fallbackSource === "duckai") {
          response = await useDuckAPI(userMessages, model);
          const result = await processDuckStream(response.data);
          return res.json(result);
        } else {
          response = await usePuterAPI(userMessages, model);
          
          if (streamMode) {
            const result = await processPuterStream(response.data);
            return res.json(result);
          }
          
          let fullResponse = '';
          
          response.data.on('data', chunk => {
            console.log('Received chunk from fallback:', chunk.toString());
            fullResponse += chunk.toString();
          });
          
          response.data.on('end', () => {
            console.log('Fallback response collection complete');
            try {
              const rawData = JSON.parse(fullResponse);
              
              const simplifiedResponse = {
                model: rawData.result.message.model,
                content: rawData.result.message.content[0].text,
                usage: rawData.result.usage
              };
              
              res.json(simplifiedResponse);
            } catch (err) {
              console.error('Error parsing fallback response:', err);
              res.status(500).json({ 
                error: 'Failed to parse fallback response',
                message: err.message
              });
            }
          });
          
          response.data.on('error', (err) => {
            console.error('Fallback stream error:', err);
            res.status(500).json({ error: 'Fallback stream error: ' + err.message });
          });
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr.message);
        res.status(500).json({ error: 'All API attempts failed: ' + fallbackErr.message });
      }
    }
  } catch (err) {
    console.error('API request error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response headers:', err.response.headers);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({ error: err.toString() });
  }
});

module.exports = router;