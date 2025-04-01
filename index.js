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

  // Reference each stat paragraph ID container from the html
  const ahiContainer = document.querySelector('#ahiValue');
  const pressureContainer = document.querySelector('#pressureValue');
  const leakRateContainer = document.querySelector('#leakRate');
  const epapContainer = document.querySelector('#epapValue');

  // clear content from each container
  ahiContainer.innerHTML = '';
  pressureContainer.innerHTML = '';
  leakRateContainer.innerHTML = '';
  epapContainer.innerHTML = '';

  // loop through each data and display corresponding stat in the html container
  data.forEach (day => {

    console.log('day', day);

    // AHI
    const ahiStat = document.createElement('p');
    // ternary operator to check if the value is null or undefined, if yes then set to N/A, else display it 
    const ahiValue = (day.attributes?.ahi_summary?.total !== undefined && day.attributes?.ahi_summary?.total !== null)
      ? day.attributes.ahi_summary.total.toFixed(2)
      : "N/A";
      ahiStat.textContent = ahiValue;
    ahiContainer.appendChild(ahiStat);
    
    // Pressure
    const pressureStat = document.createElement('p');
    const pressureValue = (day.attributes?.pressure_summary?.av !== undefined && day.attributes?.pressure_summary?.av !== null)
      ? day.attributes.pressure_summary.av.toFixed(2)
      : "N/A";
      pressureStat.textContent = pressureValue;
    pressureContainer.appendChild(pressureStat);
    
    // Leak Rate
    const leakRateStat = document.createElement('p');
    const leakRateValue = (day.attributes?.leak_rate_summary?.av !== undefined && day.attributes?.leak_rate_summary?.av !== null)
      ? day.attributes.leak_rate_summary.av.toFixed(2)
      : "N/A";
      leakRateStat.textContent = leakRateValue;
    leakRateContainer.appendChild(leakRateStat);
    
    // EPAP
    const epapStat = document.createElement('p');
    const epapValue = (day.attributes?.epap_summary?.av !== undefined && day.attributes?.epap_summary?.av !== null)
      ? day.attributes.epap_summary.av.toFixed(2)
      : "N/A";
      epapStat.textContent = epapValue;
    epapContainer.appendChild(epapStat);
  })

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
