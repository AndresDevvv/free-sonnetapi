const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chatRoute = require('./routes/chat');
const app = express();
// whyd i make this file 
app.use(cors());
app.use(bodyParser.json());
app.use(chatRoute);
app.listen(3032); 