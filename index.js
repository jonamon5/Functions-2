// Call the static json file - not dummy since this is pulled from the SleepHQ API response 
async function loadDummyData() {
  try {
    const response = await fetch("../data/all_dates.json");
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

let currentDateIndex = 0; // Track the selected date index

// Dynamically display dates and data on the page 
window.addEventListener('load', async () => {
  const machineDatesData = await fetchMachineDates();
  const data = machineDatesData.data;
  console.log(data);

// Dynamically insert the date into the date-circles 
  const dateSection = document.getElementById('date-section');
  dateSection.innerHTML = ''; // First clear any existing content.

  // Loop over each day and display the dates
  data.forEach((day, index) => {
    if(day.attributes.date) {
      const dateObj = new Date(day.attributes.date);
      const formattedDate = dateObj.toLocaleDateString(); //format the date 

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

  // Update core stats based on the current day's data
  const updateCoreStats = (day) => {

    // AHI
    // Ternary operator to check if the value isn't null, then display data, else N/A
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
    //send over sleep data,selected date, and morning response 
    const payload = {data, selectedIndex: currentDateIndex, morningResponses: morningResponses};
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

// Morning Check In 
const startNowButton = document.querySelector('.start-now');
const modal = document.getElementById('morningModal');
const questionText = document.getElementById('question');
const answerInput = document.getElementById('answer');
const optionsContainer = document.getElementById('optionsContainer');
const continueButton = document.getElementById('continueButton');

// // Questions
const questions = [
  "How rested do you feel this morning?",
  "Did you experience any discomfort while using CPAP?",
  "Did you wake up and remove your mask at any point?",
  "Did you wake up last night due to CPAP discomfort or something else?",
]

// // start with first question and no answers 
let currentQuestionIndex = 0;
let responses = [];
let morningResponses = {};

// Create the option buttons
function createOption(text){
  const button = document.createElement('button'); //create the buttons for each option
  button.textContent = text;
  button.classList.add('option-button');
  button.addEventListener('click', () => {
    document.querySelectorAll('.option-button').forEach(circle => {
      circle.classList.remove('selected');
    });
    button.classList.remove('selected');
    responses[currentQuestionIndex] = text; //when button is clicked, save the answwer
    button.classList.add('selected');
  });
  optionsContainer.appendChild(button);
}

function loadQuestion() {
  optionsContainer.innerHTML = '';

  switch (currentQuestionIndex) {
    case 0:
      questionText.textContent = questions[0]; //1st question
      createOption("Well rested");
      createOption("Fairly rested");
      createOption("Neutral");
      createOption("Somewhat Tired");
      createOption("Exhausted");
      break;
    case 1:
      questionText.textContent = questions[1]; //2nd question
      createOption("No Issues");
      createOption("Mask discomfort");
      createOption("Dry Mouth");
      createOption("Breathing felt restricted");
      break;
    case 2:
      questionText.textContent = questions[2]; //3rd question
      createOption("No, I wore it all night");
      createOption("Yes, I removed it once");
      createOption("Yes, I removed it multiple times");
      break;
    case 3:
      questionText.textContent = questions[3]; //4th question
      createOption("No I slept well");
      createOption("I woke up for the bathroom");
      createOption("I had nightmares/PSTD episodes");
      break;
      default:
      break;
  }
}

// When the user clicks "Start Now", show the modal and load the first question.
startNowButton.addEventListener('click', () => {
  modal.classList.remove('hidden');
  currentQuestionIndex = 0;
  responses = []; 
  loadQuestion();
});

// When the user clicks "Continue"
continueButton.addEventListener('click', () => {
  if (responses[currentQuestionIndex]) { // if answer exist go to next question
    currentQuestionIndex++;
    if (currentQuestionIndex < 4) { 
      loadQuestion();
    } else {
      modal.classList.add('hidden'); //hide modal when all questions are answered
      morningResponses = {
        rested: responses[0],
        discomfort: responses[1],
        maskRemoval: responses[2],
        wakeUpReason: responses[3],
      };
      console.log("Morning Responses:", morningResponses);
    }
  }
});