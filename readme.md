# SonnetAPI 🤖

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)

A powerful and lightweight API that provides seamless access to Claude 3.5 and Claude 3.7 models through multiple backends (Puter.com and DuckAI), featuring an OpenAI-compatible interface.

## ✨ Features

- **Multiple Models**: Support for both Claude 3.5 Sonnet and Claude 3.7 Sonnet
- **Backend Flexibility**: Automatic fallback between Puter.com and DuckAI backends
- **OpenAI Compatibility**: Drop-in replacement for OpenAI API calls
- **Streaming Support**: Real-time response streaming capability
- **Zero Configuration**: No API keys or complex setup required
- **Lightweight**: Built on Express.js for optimal performance

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/andresdevvv/free-sonnetapi.git
```

2. Install dependencies:
```bash
cd free-sonnetapi
npm install
```

3. Start the server:
```bash
node index.js
```

The server will start on port 3032 by default.

## 📝 API Usage

### Basic Request
```javascript
const response = await fetch('http://localhost:3032/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "claude3.5",  // or "claude3.7"
    messages: [
      {
        "role": "user",
        "content": "Write a hello world program in Python"
      }
    ]
  })
});

const data = await response.json();
```

### Advanced Options

```javascript
const response = await fetch('http://localhost:3032/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "claude3.7",
    messages: [
      {
        "role": "system",
        "content": "You are a helpful coding assistant"
      },
      {
        "role": "user",
        "content": "Write a hello world program in Python"
      }
    ],
    stream: true,  // Enable streaming responses
    source: "duckai" // Explicitly select backend source
  })
});
```

### Example Response
```json
{
    "model": "claude-3-7-sonnet-latest",
    "content": "Here's a simple Hello World program in Python:\n\nprint('Hello, World!')",
    "usage": {
        "prompt_tokens": 24,
        "completion_tokens": 12,
        "total_tokens": 36
    }
}
```

## ⚠️ Security Considerations

1. **CORS Configuration**: By default, CORS is disabled. Configure it appropriately in `routes/chat.js` based on your needs.
2. **Rate Limiting**: Consider implementing rate limiting for production use.
3. **Proxy Support**: Use a reverse proxy (like Nginx) in production.

## 🔧 Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `PORT` | Server port | 3032 |
| `model` | AI model to use | claude3.5 |
| `source` | Backend source | puter |
| `stream` | Enable streaming | false |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

For detailed documentation and API reference, visit:
[sonnetapi.andresdev.org](https://sonnetapi.andresdev.org)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

While credit is not required, it is appreciated. Feel free to star the repository if you find it useful!
