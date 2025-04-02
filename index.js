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

let currentDateIndex = 0; // Ttrack the selected date index

// Dynamically display dates and data on the page 
window.addEventListener('load', async () => {
  const machineDatesData = await fetchMachineDates();
  const data = machineDatesData.data;
  console.log(data);

// Dynamically insert the date into the date-circles 
  const dateSection = document.getElementById('date-section');
  dateSection.innerHTML = ''; // Clear any existing content.

  // Loop over each day and display the dates`
  data.forEach((day, index) => {
    if(day.attributes.date) {
      const dateObj = new Date(day.attributes.date);
      const formattedDate = dateObj.toLocaleDateString();

      // create date-circle and single-date div + paragraph - this goes inside the #date-section
      const dateCircle = document.createElement('div');
      dateCircle.classList.add('date-circle');
      dateCircle.dataset.index = index; // Store the index for later use

      const dateText = document.createElement('p');
      dateText.classList.add('single-date');
      dateText.textContent = formattedDate;

      // Update the stats for this specific date 
      dateText.addEventListener('click', () => {
        updateCoreStats(day);
      });

      dateCircle.appendChild(dateText);
      dateSection.appendChild(dateCircle);

      dateCircle.addEventListener('click', () => {
        // Remove "selected" class from all date circles
        document.querySelectorAll('.date-circle').forEach(circle => {
          circle.classList.remove('selected');
        });
        // Add "selected" class to the clicked one
        dateCircle.classList.add('selected');

        // Update core stats for selected day and set the current date index
        currentDateIndex = Number(dateCircle.dataset.index);
        updateCoreStats(day);
      });
    }
  });

  // Update core stats based on the curren day's data
  const updateCoreStats = (day) => {

    // AHI - ternary operator to check if the value isn't null, then display data, else N/A
    document.getElementById('ahiValue').textContent =
      (day.attributes?.ahi_summary?.total != null)
        ? day.attributes.ahi_summary.total.toFixed(2)
        : "N/A";

    // PRESSURE
    document.getElementById('pressureValue').textContent =
      (day.attributes?.pressure_summary?.av != null)
        ? day.attributes.pressure_summary.av.toFixed(2)
        : "N/A";

    // LEAK RATE 
    document.getElementById('leakRate').textContent =
      (day.attributes?.leak_rate_summary?.av != null)
        ? day.attributes.leak_rate_summary.av.toFixed(2)
        : "N/A";
    
    // EPAP
    document.getElementById('epapValue').textContent =
      (day.attributes?.epap_summary?.av != null)
        ? day.attributes.epap_summary.av.toFixed(2)
        : "N/A";
  };

  // display most recent date data by default
  if (data.length > 0) {
    updateCoreStats(data[0]);
  }

  // Call the backend API to generate insights - hosted on Vercel serverless domain
  document.getElementById('generateInsightsButton').addEventListener('click', async () => {
    const payload = {data, selectedIndex: currentDateIndex}; //send over sleep data and the selected date index as the current date; so OPENAPI knows which date to look at 
    console.log("payload",payload);
    console.log("payload",payload);
    console.log("payload",payload);
    try {
      const response = await fetch('https://functions-2.vercel.app/api/getInsights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      document.getElementById('all-insights').textContent = result.insights;
    } catch (error) {
      console.error(error);
      document.getElementById('all-insights').textContent = 'Error fetching insights';
    }
  });
});