const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Endpoint that proxies the call to OpenAI
app.post('/api/getInsights', async (req, res) => {
  const { data, selectedIndex } = req.body;

  // use the current day's data and first day's data by default
  const day = (data && typeof selectedIndex === 'number' && data[selectedIndex])
  ? data[selectedIndex] 
  : data[0];

  
// custom prompt acting as an ENT doctor and provided with my personal health info + sleep data
  const prompt = `
  You are an ENT specialist and a patient has come to you with their sleep data. 
  
  The patient profile is as follows:
  Age: 28,
  Ethnicity: Chinese-American,
  Gender: Male,
  Weight: 135lbs,
  Height: 5'7",
  Build: Average,
  Pre-existing conditions: None,
  Medications: None,
  Allergies: None,
  Smoking: No,
  Alcohol: No,
  Exercise: 3 times a week,
  Diet: Balanced,
  Sleep position: Side and Back,
  
  Their CPAP data for a single night is as follows:
  \n\nAHI Total: ${day.attributes.ahi_summary.total}
  \n\nAHI Hypopnea: ${day.attributes.ahi_summary.hypopnea}
  \n\nAHI All Apnea: ${day.attributes.ahi_summary.all_apnea}
  \n\nAHI CSA : ${day.attributes.ahi_summary.clear_airway}
  \n\nAHI OSA: ${day.attributes.ahi_summary.obstructive_apnea}
  \n\nAHI UA: ${day.attributes.ahi_summary.unidentified_apnea}
  \nPressure: ${day.attributes.pressure_summary.av}
  \nLeak Rate: ${day.attributes.leak_rate_summary.av}
  \nFlow Limit: ${day.attributes.flow_limit_summary.av}
  \nResp Rate: ${day.attributes.resp_rate_summary.av}
  \nEPAP: ${day.attributes.epap_summary.av}
  \nMachine Settings: ${day.attributes.machine_settings.mode}, ${day.attributes.machine_settings.mask}, ${day.attributes.machine_settings.pressure_min}, ${day.attributes.machine_settings.pressure_max}
  
  Given all this information, please provide a brief but broad overview of the patient's sleep health that night and any recommendations to improve treatment. 
  Please include he following numbers in your overview: AHI Total, Pressure, Leak Rate, and EPEP
  The overview must be 500 characters or less.`;

//   call to OpenAI API endpont
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ insights: response.data.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching insights' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

