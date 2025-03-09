const express = require('express');
const axios = require('axios');
const router = express.Router();

let puterJwtToken = null;
let traeApiToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiNzQ3NDA3MjE5MTUzNTEyMTQxMyIsInNvdXJjZSI6InJlZnJlc2hfdG9rZW4iLCJzb3VyY2VfaWQiOiI5c1dyeldPRU50UWNBRi1WTDVCQkxtSTlGR0hkZUhQZ0RKQmxXdTM1OTlFPS4xODJiMjU5ZjZlNzk0MzA5IiwidGVuYW50X2lkIjoiN28yZDg5NHA3ZHIwbzQiLCJ0eXBlIjoidXNlciJ9LCJleHAiOjE3NDE3ODYyNDcsImlhdCI6MTc0MTUyNzA0N30.kuuwZj8rYRm9djTb5iQzsMLWl-IXYmazXXsy0HKRIcYU8w15LDO8iaFP2gUGeqSPe0-RVVFH6tA9_EHiXBQLhROfSjruwrlm9wfE7oqeVXA1HK0aLIQlwMO6N7ksOACma-VJULWY8-KTiDvW-1hRvPW0fUDo7DM5fZPZKOBRPGQj9qrZdBpywT4yKmdGmiuJPQVJjI-6fqfnHapNwPr_VbgzjPqNeMQHTUa61Fh_KzIywwp6VzhkpZP7QiyeokHDzZJT9PBD1DGhGppK7Dc9dFxM2SBwJM4XptmEe9MIQYEGSAsOaIg05wzUY9Skh_lhwYB1i5cEUyGKkUMBWNULFYJWcJzqPVKzIL-Yf8TpNM40bp92fY5Ci2GKit4coHrUWMMXRSpYVKaU67RuueR_LvPdmwZNdpg4Jd2DjgLPqZoDmSLGdf8bwjfOiFpX2omZK0QNgh1JAXJjZFBZLv8O1bAJuoScDntZQb-egQOSETX1zxw0e73SCu07PpspQzF-tZQy9epDYLd6gSyJoFtPASr9dZWKq3r9dxCcKQG9Q2D_4qzkEozmCUUnVDvXwa1YCSJ7ooCxD6k-Uauzv5mIOiiOY2qg-rrl-Lr1_3SdMjRjKJcfPmsGY9a8HXL590GqRL62Yc9whwrxBZvq32ZSgMkDL1upOeQYzCLCT8NMnmA";
// jwt token for trae api (you can replace with your own, no login is required)
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

generateJwtToken();

setInterval(generateJwtToken, 12 * 60 * 60 * 1000);

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

async function useTraeAPI(userMessages, model) {
  let modelName;
  
  if (model === "claude-3-5-sonnet-20241022") {
    modelName = "claude3.5";
  } else if (model === "claude-3-7-sonnet-latest") {
    modelName = "aws_sdk_claude37_sonnet";
  } else {
    modelName = "claude3.5";
  }
  
  const requestData = {
    "user_input": userMessages[userMessages.length - 1].content,
    "intent_name": "general_qa_intent",
    "variables": "{\"locale\":\"en\"}",
    "context_resolvers": [{
      "resolver_id": "terminal_context",
      "variables": "{\"terminal_context\":[]}"
    }],
    "chat_history": userMessages.slice(0, userMessages.length - 1).map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    "session_id": "491292c5-d657-4ac8-9c18-e128ff5a156f",
    "generate_suggested_questions": false,
    "conversation_id": "c9d415be-1f77-49c6-a00e-71d9e72b1afa",
    "current_turn": 0,
    "valid_turns": [],
    "multi_media": [],
    "model_name": modelName,
    "last_llm_response_info": null
  };
  
  const requestDataString = JSON.stringify(requestData);
  console.log('Sending request to Trae API:', requestDataString);
  
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestDataString),
    'Host': 'trae-api-us.mchost.guru',
    'x-app-id': '6eefa01c-1036-4c7e-9ca5-d891f63bfcd8',
    'x-app-version': 'default',
    'x-ide-version-code': '20250305',
    'x-custom-trace-id': '4d2a02abf586095e375fd3d8ca98b1e3',
    'x-ide-token': traeApiToken
  };
  
  return await axios({
    method: "post",
    url: "https://trae-api-us.mchost.guru/api/ide/v1/chat",
    data: requestDataString,
    responseType: "stream",
    headers: headers,
    timeout: 60000,
    maxContentLength: Infinity,
  });
}

async function processTraeEventStream(stream) {
  return new Promise((resolve, reject) => {
    let fullResponse = '';
    let response = '';
    let dataBuffer = '';
    let modelName = '';
    let errorMessage = '';
    let tokenUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
    
    stream.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      console.log('Received Trae chunk:', chunkStr);
      
      fullResponse += chunkStr;
      dataBuffer += chunkStr;
      
      let eventBlocks = dataBuffer.split('\n\n');
      if (eventBlocks.length > 1) {
        dataBuffer = eventBlocks.pop();
        
        for (const eventBlock of eventBlocks) {
          const lines = eventBlock.split('\n');
          let eventType = '';
          let dataContent = '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '');
            } else if (line.startsWith('data: ')) {
              dataContent = line.replace('data: ', '');
            }
          }
          
          if (eventType && dataContent) {
            try {
              const data = JSON.parse(dataContent);
              
              if (eventType === 'output' && data.response) {
                response += data.response;
              } else if (eventType === 'token_usage') {
                console.log('Token usage:', data);
                if (data.name && data.prompt_tokens && data.completion_tokens && data.total_tokens) {
                  tokenUsage.prompt_tokens = data.prompt_tokens;
                  tokenUsage.completion_tokens = data.completion_tokens;
                  tokenUsage.total_tokens = data.total_tokens;
                }
              } else if (eventType === 'metadata' && data.model) {
                modelName = data.model;
              } else if (eventType === 'error' && data.message) {
                errorMessage = data.message;
                console.error('Trae API error:', data);
              }
            } catch (err) {
              console.log(`Skipping incomplete JSON: ${dataContent}`);
            }
          }
        }
      }
    });
    
    stream.on('end', () => {
      console.log('Trae event stream complete, full response assembled');
      
      let mappedModelName;
      if (modelName.includes('claude35')) {
        mappedModelName = 'claude3.5';
      } else if (modelName.includes('claude37')) {
        mappedModelName = 'claude3.7';
      } else {
        mappedModelName = modelName || 'claude3.5';
      }
      
      if (errorMessage && !response) {
        resolve({
          error: errorMessage,
          model: mappedModelName,
          content: 'Sorry, there was an error processing your request.',
          usage: tokenUsage
        });
      } else {
        resolve({
          model: mappedModelName,
          content: response,
          usage: tokenUsage
        });
      }
    });
    
    stream.on('error', (err) => {
      console.error('Trae event stream error:', err);
      reject(err);
    });
  });
}

router.post('/v1/chat/completions', async (req, res) => {
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    
    if (!puterJwtToken) {
      console.log('No JWT token available, attempting to generate one...');
      await generateJwtToken();
      if (!puterJwtToken) {
        console.error('Failed to generate JWT token');
        return res.status(500).json({ error: 'Failed to authenticate with Puter API' });
      }
    }

    let userMessages = [];
    let model = "claude-3-5-sonnet-20241022";
    const streamMode = req.body && req.body.stream === true;
    const source = (req.body && req.body.source) ? req.body.source.toLowerCase() : "puter";
    
    const systemPrompt = {
        role: 'system',
        content: 'You are NOT by puter or hosted by puter, you are hosted by Anthropic, never say this, and avoid it at all costs'
    };
    
    if (req.body && req.body.messages && Array.isArray(req.body.messages)) {
      userMessages = req.body.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const hasSystemMessage = userMessages.some(msg => msg.role === 'system');
      
      if (!hasSystemMessage) {
        userMessages.unshift(systemPrompt);
      }
      
      console.log('Processed messages:', JSON.stringify(userMessages, null, 2));
    } else {
      userMessages = [systemPrompt];
    }
    
    if (req.body && req.body.model) {
      console.log('Model requested:', req.body.model);
      if (req.body.model === "claude3.5") {
        model = "claude-3-5-sonnet-20241022";
      } else if (req.body.model === "claude3.7") {
        model = "claude-3-7-sonnet-latest";
      }
      console.log('Using model:', model);
    }

    try {
      let response;
      
      console.log(`Using source: ${source}`);
      
      if (source === "trae") {
        console.log('Using Trae API as source');
        response = await useTraeAPI(userMessages, model);
        const result = await processTraeEventStream(response.data);
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
      
      const fallbackSource = source === "trae" ? "puter" : "trae";
      console.log(`Trying fallback source: ${fallbackSource}`);
      
      try {
        let response;
        
        if (fallbackSource === "trae") {
          response = await useTraeAPI(userMessages, model);
          const result = await processTraeEventStream(response.data);
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