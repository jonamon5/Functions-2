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

    const insights = document.getElementById('all-insights');
    const description = document.getElementById('insightDescription');
    insights.textContent = "Generating...";
    generateInsightsButton.innerHTML = "Regenerate";
    
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

      description.classList.add('hidden'); // hide the description

      try {
        // Eric Li's recommendation: convert response into JSON with multiple keys 
        // Parse the JSON string into an object
        const parsedData = JSON.parse(result.insights);

        // Display the summary and recommended actions
        insights.innerHTML = `

        <div class="insight-summary">
          <h3>Summary</h3>
          <p>${parsedData.summary}</p>
        </div>
        <img src="/Assets/divider line.png" alt="">
        <div class="insight-actions">
          <h3>Recommended Actions</h3>
          <ul>
          ${parsedData.recommendedActions.map(action => 
            `<li>${action}</li>`
          ).join('')}
          </ul>
        </div>
        
        `;
      } catch (error) {
        console.error(error);
        insights.textContent = "Error processing insights.";
      }

      // document.getElementById('all-insights').textContent = result.insights;
    } catch (error) {
      console.error(error);
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
  "Did you experience any discomfort?",
  "Did you wake up and remove your mask?",
  "What was the reason for waking up?",
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

    if (currentQuestionIndex === questions.length - 1) {
      continueButton.textContent = "Finish";
    } else {
      continueButton.textContent = "Continue";
    }

  questionText.classList.add('slide-out-left');
  optionsContainer.classList.add('slide-out-left');

  setTimeout(() => {

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
      createOption("Too much pressure");
      break;
      case 2:
        questionText.textContent = questions[2]; //3rd question
        createOption("No, I wore it all night");
        createOption("Yes, I removed it once");
        createOption("Yes, I removed it twice");
        createOption("Yes, I removed it multiple times");
        createOption("I don't remember");
        
        break;
        case 3:
          questionText.textContent = questions[3]; //4th question
          createOption("No I slept well");
          createOption("I woke up for the bathroom");
          createOption("I had nightmares/PSTD episodes");
          createOption("Sound or other external factors");
          createOption("Other");
      break;
      default:
      break;
  }

  questionText.classList.remove('slide-out-left');
  optionsContainer.classList.remove('slide-out-left');
  questionText.classList.add('slide-in-right');
  optionsContainer.classList.add('slide-in-right');

  setTimeout(() => {
    questionText.classList.remove('slide-in-right');
    optionsContainer.classList.remove('slide-in-right');
  }, 300);

}, 300);
}

// When the user clicks "Start Now", show the modal and load the first question.
startNowButton.addEventListener('click', () => {
  modal.classList.remove('hidden');

  setTimeout(() => {
    modal.classList.add('show');
  }, 10);

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
      modal.classList.remove('show'); //hide modal when all questions are answered

      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);

      morningResponses = {
        rested: responses[0],
        discomfort: responses[1],
        maskRemoval: responses[2],
        wakeUpReason: responses[3],
      };
      console.log("Morning Responses:", morningResponses);

      // when quiz is completed, replace the start now button with a completed message
      startNowButton.textContent = "Completed";
      startNowButton.classList.add("completed-button")
      startNowButton.classList.remove("start-now")
      startNowButton.disabled = true;
    }
  }
});

const closeModalButton = document.getElementById('closeModal');

closeModalButton.addEventListener('click', () => {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300); 
});