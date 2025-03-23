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
        'authorization': 'Bearer YOUR_EXPIRED_OR_VALID_TOKEN'
      }
    });

    if (!response.ok) {
      throw new Error('API request unsuccessful');
    }

    return await response.json();
  } catch (error) {
    console.error(error);
    return await loadDummyData();
  }
}

// Call fetch, then update DOM
window.addEventListener('DOMContentLoaded', async () => {
  const machineDatesData = await fetchMachineDates();
  const data = machineDatesData.data;
  console.log("data",data);
 
  document.getElementById('ahiValue').textContent =
    (data[0].attributes.ahi_summary.total).toFixed(2);

  document.getElementById('pressureValue').textContent =
    (data[0].attributes.pressure_summary.av).toFixed(2);
  
  document.getElementById('leakRate').textContent =
  (data[0].attributes.leak_rate_summary.av).toFixed(2);
  
  document.getElementById('epapValue').textContent =
  (data[0].attributes.epap_summary.av).toFixed(2)
});