// Call the static json file - not dummy since this is pulled from the SleepHQ API response 
async function loadDummyData() {
  try {
    const response = await fetch('./data/all_dates.json');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Call SleepHQ API to get machine dates data (if token is valid)
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

window.addEventListener('load', async () => {
  const machineDatesData = await fetchMachineDates();
  const data = machineDatesData.data;
  console.log(data);

  // Display these values on the home page - hardcoded to a single day for now 
  document.getElementById('ahiValue').textContent = data[0].attributes.ahi_summary.total.toFixed(2);
  document.getElementById('pressureValue').textContent = data[0].attributes.pressure_summary.av.toFixed(2);
  document.getElementById('leakRate').textContent = data[0].attributes.leak_rate_summary.av.toFixed(2);
  document.getElementById('epapValue').textContent = data[0].attributes.epap_summary.av.toFixed(2);

// Call the backend API to generate insights - hosted on Vercel serverless domain
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
