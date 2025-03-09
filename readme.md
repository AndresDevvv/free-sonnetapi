# SonnetAPI

A simple API that provides access to Claude 3.5 and Claude 3.7 models through Puter.com and Trae IDE backends.

## Features

- Access to Claude 3.5 Sonnet and Claude 3.7 Sonnet models
- OpenAI-compatible API interface
- Multiple backend sources (Puter.com and Trae IDE)
- Simple Express.js implementation
- There is currently no Authentication built in

## Installation

```bash
git clone https://github.com/andresdevvv/free-sonnetapi.git
cd free-sonnetapi
npm install
```

## Usage

Start the server:

```bash
node index.js
```

# DO NOT ALLOW CORS FROM EVERYWHERE (*) DISABLE IT IN routes/chat.js

The server will run on port 3032 by default.

## API Endpoints

The API aims to be compatible with OpenAI's interface. Example usage:

```javascript
fetch('http://localhost:3032/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "claude3.5", // or "claude3.7"
    messages: [
       {
         "role": "user", 
         "content": "Hi! who made you or hosts you?"
       }
     ]
  })
})
.then(response => response.json())
.then(data => console.log(data));
```
# Response Example:
```
{
    "model": "claude3.5",
    "content": "I am Trae AI, an AI programming assistant. I'm here to help you with software development related questions. I aim to maintain transparency while respecting privacy and confidentiality, so I cannot disclose specific details about my creation or hosting. How can I assist you with your programming needs today?",
    "usage": {
        "prompt_tokens": 1182,
        "completion_tokens": 65,
        "total_tokens": 1247
    }
}
```

## Contribution

Feel free to make a contribution by submitting a pull request.

## Documentation

For more detailed documentation, visit: [sonnetapi](https://sonnetapi.andresdev.org)

## License

This project is licensed under the [MIT License](LICENSE).
