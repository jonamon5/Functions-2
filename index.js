// // load the static sleepHQ data I copied if the SleepHQ request fails 
// async function loadDummyData() {
//   try {
//     const response = await fetch('./data/all_dates.json');
//     return await response.json();
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }

// // Fetch SleepHQ API endpoints for all machine data
// async function fetchMachineDates() {
//   try {
//     const response = await fetch('https://sleephq.com/api/v1/machines/47720/machine_dates?sort_order=desc&page=1&per_page=100', {
//       headers: {
//         'accept': 'application/vnd.api+json',
//         'authorization': 'Bearer xYntDEJhycy7YkVuGWwJWFnTxqPWgH8m4HDdWPsqhG0'
//         // this token has no refresh endpoint so will expire in 10min.
//         // short term solution is to replace with static data or refresh token manually when testing
//       }
//     });

//     if (!response.ok) {
//       throw new Error('API request unsuccessful');
//     }

//     return await response.json();
//   } catch (error) {
//     console.error(error);
//     return await loadDummyData();
//   }
// }

// // https://platform.openai.com/docs/api-reference/introduction
// async function getInsights(data) {

//   // const apiKey = process.env.OPENAI_API_KEY;
//   const prompt = `
//   You are an ENT specialist and a patient has come to you with their sleep data. 
  
//   The patient profile is as follows:
//   Age: 28,
//   Ethnicity: Chinese-American,
//   Gender: Male,
//   Weight: 135lbs,
//   Height: 5'7",
//   Build: Average,
//   Pre-existing conditions: None,
//   Medications: None,
//   Allergies: None,
//   Smoking: No,
//   Alcohol: No,
//   Exercise: 3 times a week,
//   Diet: Balanced,
//   Sleep position: Side and Back,
  
//   Their CPAP data for a single night is as follows:
//   \n\nAHI Total: ${data[0].attributes.ahi_summary.total}
//   \n\nAHI Hypopnea: ${data[0].attributes.ahi_summary.hypopnea}
//   \n\nAHI All Apnea: ${data[0].attributes.ahi_summary.all_apnea}
//   \n\nAHI CSA : ${data[0].attributes.ahi_summary.clear_airway}
//   \n\nAHI OSA: ${data[0].attributes.ahi_summary.obstructive_apnea}
//   \n\nAHI UA: ${data[0].attributes.ahi_summary.unidentified_apnea}
//   \nPressure: ${data[0].attributes.pressure_summary.av}
//   \nLeak Rate: ${data[0].attributes.leak_rate_summary.av}
//   \Flow Limit: ${data[0].attributes.flow_limit_summary.av}
//   \Resp Rate: ${data[0].attributes.resp_rate_summary.av}
//   \nEPAP: ${data[0].attributes.epap_summary.av}
//   \n\Machine Settings: ${data[0].attributes.machine_settings.mode}, ${data[0].attributes.machine_settings.mask}, ${data[0].attributes.machine_settings.pressure_min}, ${data[0].attributes.machine_settings.pressure_max}

// Given all this information, please provide a brief but broad overview of the patient's sleep health that night and any recommendations to improve treatment. The overview must be 600 characters or less.`;
// // 600 character limit doess't seem to be working

// try {
//   const response = await axios.post('https://api.openai.com/v1/chat/completions', {
//     model: 'gpt-3.5-turbo',
//     messages: [{ role: 'user', content: prompt }],
//     max_tokens: 400
//   }, {
//     headers: {
//       'Authorization': `Bearer ${apiKey}`,
//       'Content-Type': 'application/json'
//     }
//   });
//   console.log(response.data.choices[0].message.content);
//   return response.data.choices[0].message.content;
  
// } catch (error) {
//     console.error(error);
//     return 'Error fetching insights';
//   }
// }

// window.addEventListener('load', async () => {
//   const machineDatesData = await fetchMachineDates();
//   const data = machineDatesData.data;
//   console.log(data);

//   document.getElementById('ahiValue').textContent = data[0].attributes.ahi_summary.total.toFixed(2);
//   document.getElementById('pressureValue').textContent = data[0].attributes.pressure_summary.av.toFixed(2);
//   document.getElementById('leakRate').textContent = data[0].attributes.leak_rate_summary.av.toFixed(2);
//   document.getElementById('epapValue').textContent = data[0].attributes.epap_summary.av.toFixed(2);

//   // Attach OPENAI APi call to button click - don't want to use up too much money on API calls
//   document.getElementById('generateInsightsButton').addEventListener('click', async () => {
//     const insights = await getInsights(data);
//     document.getElementById('all-insights').textContent = insights;
//   });

// });

async function loadDummyData() {
  try {
      const response = await fetch('./data/all_dates.json');
      return await response.json();
  } catch (error) {
      console.error(error);
      return null;
  }
}

async function fetchMachineDates() {
  try {
      const response = await fetch('https://sleephq.com/api/v1/machines/47720/machine_dates?sort_order=desc&page=1&per_page=100', {
          headers: {
              'accept': 'application/vnd.api+json',
              'authorization': 'Bearer xYntDEJhycy7YkVuGWwJWFnTxqPWgH8m4HDdWPsqhG0'
              // Note: This token expires in 10 min. Replace with static data or refresh as needed.
          }
      });

      if (!response.ok) {
          throw new Error('API request unsuccessful');
      }

      return await response.json();
  } catch (error) {
      // console.error(error);
      return await loadDummyData();
  }
}

// Use the backend endpoint for insights to keep your API key secure
window.addEventListener('load', async () => {
  const machineDatesData = await fetchMachineDates();
  const data = machineDatesData.data;
  console.log(data);

  document.getElementById('ahiValue').textContent = data[0].attributes.ahi_summary.total.toFixed(2);
  document.getElementById('pressureValue').textContent = data[0].attributes.pressure_summary.av.toFixed(2);
  document.getElementById('leakRate').textContent = data[0].attributes.leak_rate_summary.av.toFixed(2);
  document.getElementById('epapValue').textContent = data[0].attributes.epap_summary.av.toFixed(2);

  // Attach generate insights event listener inside the load callback so that data is defined.
  document.getElementById('generateInsightsButton').addEventListener('click', async () => {
    try {
        const response = await fetch('https://functions-2.vercel.app/api/getInsights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });
        const result = await response.json();
        document.getElementById('all-insights').textContent = result.insights;
    } catch (error) {
        console.error(error);
        document.getElementById('all-insights').textContent = 'Error fetching insights';
    }
});

});