import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// store the OpenAI API key in .env file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log(OPENAI_API_KEY);

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;

//   Call OpenAI API endpoint 
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400
      })
    });
    console.log(OPENAI_API_KEY);
    const data = await openaiResponse.json();
    return res.json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error calling OpenAI API' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
