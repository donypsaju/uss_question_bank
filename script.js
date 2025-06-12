// START OF SCRIPT.JS
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');

const questionCounterEl = document.getElementById('question-counter');
const questionTextEl = document.getElementById('question-text');
const optionsContainerEl = document.getElementById('options-container');
const resultsContainerEl = document.getElementById('results-container');

let allQuestions = []; // To store all questions fetched from JSON
let quizQuestions = []; // To store the selected questions for the current quiz
let currentQuestionIndex = 0;

// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (!Array.isArray(jsonData)) {
            throw new Error("Questions data is not a valid JSON array.");
        }
        if (jsonData.length === 0) {
            throw new Error("Questions file is empty or does not contain any questions.");
        }
        allQuestions = jsonData; // Store fetched questions
        // selectQuizQuestions() will be called by the start button logic after this
    } catch (error) {
        console.error("Could not load or parse questions.json:", error);
        // Display a comprehensive error message to the user via the UI
        questionTextEl.textContent = `Error loading quiz: ${error.message}. Please check the 'questions.json' file and ensure it's correctly formatted and accessible.`;
        
        // Update UI to show error state cleanly
        startScreen.classList.add('hidden'); // Hide start button
        quizScreen.classList.remove('hidden'); // Show quiz area to display the error
        optionsContainerEl.innerHTML = ''; // Clear any potential options
        nextBtn.classList.add('hidden'); // Hide next button
        questionCounterEl.textContent = 'Error'; // Update counter text
        
        // Rethrow the error if you want to catch it further up, or handle it completely here.
        // For this setup, handling it here by updating UI is sufficient.
        throw error; // Optional: rethrow if other parts of the app need to know about this failure
    }
}

// MODIFIED FUNCTION: selectQuizQuestions
function selectQuizQuestions() {
    quizQuestions = []; // Reset for a new quiz

    const subjectOrder = [
        { name: "Part I Malayalam", count: 5 },
        { name: "Part II Malayalam", count: 5 },
        { name: "Maths", count: 10 },
        { name: "English", count: 5 },
        { name: "Basic Science", count: 10 },
        { name: "Social Science", count: 10 }
    ];

    const expectedTotalQuestions = subjectOrder.reduce((sum, subject) => sum + subject.count, 0);

    for (const subjectInfo of subjectOrder) {
        // Filter questions for the current subject from the global allQuestions array
        let questionsFromSubject = allQuestions.filter(q => q.subject === subjectInfo.name);
        
        if (questionsFromSubject.length < subjectInfo.count) {
            console.warn(`Warning: Not enough questions for subject '${subjectInfo.name}'. Needed ${subjectInfo.count}, found ${questionsFromSubject.length}.`);
            // Decide if you want to proceed with fewer or stop. For now, it will take all available.
        }
        
        shuffleArray(questionsFromSubject); // Shuffle questions within this subject
        // Add the required number of questions (or fewer if not enough) to the quizQuestions array
        quizQuestions.push(...questionsFromSubject.slice(0, subjectInfo.count));
    }

    // Warning if not enough questions were gathered for the whole quiz
    if (quizQuestions.length < expectedTotalQuestions && allQuestions.length > 0) { 
        console.warn(`Overall Warning: Not enough questions to meet the criteria for all subjects in the specified order. Expected ${expectedTotalQuestions}, but gathered ${quizQuestions.length}. The quiz will proceed with available questions.`);
    }
    
    // The final quizQuestions array is now ordered by subject, with questions within each subject shuffled.
    console.log("Selected quiz questions (ordered by subject, shuffled within subject):", quizQuestions);
    console.log("Total questions selected for the quiz:", quizQuestions.length);
}


function displayQuestion() {
    if (currentQuestionIndex < quizQuestions.length) {
        const currentQ = quizQuestions[currentQuestionIndex];
        questionCounterEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
        questionTextEl.textContent = currentQ.question;
        optionsContainerEl.innerHTML = ''; // Clear previous options

        currentQ.options.forEach(optionText => {
            const optionButton = document.createElement('button');
            optionButton.textContent = optionText;
            optionButton.classList.add('btn', 'btn-outline-primary', 'mb-2', 'w-100');
            optionsContainerEl.appendChild(optionButton);
        });
        nextBtn.classList.remove('hidden');
    } else {
        // All questions answered
        showResults();
    }
}

function showResults() {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    resultsContainerEl.innerHTML = ''; // Clear previous results

    const title = document.createElement('h3');
    title.textContent = 'Quiz Finished - Correct Answers';
    title.classList.add('text-center', 'mb-4');
    resultsContainerEl.appendChild(title);

    quizQuestions.forEach((q, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item', 'mb-3');

        const questionP = document.createElement('p');
        questionP.innerHTML = `<strong>Q ${index + 1} (${q.subject}):</strong> ${q.question}`; // Added subject to result item
        
        const answerP = document.createElement('p');
        answerP.innerHTML = `<strong>Answer:</strong> <span class="correct-answer">${q.answer}</span>`;

        resultItem.appendChild(questionP);
        resultItem.appendChild(answerP);
        resultsContainerEl.appendChild(resultItem);
    });
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Quiz';
    restartButton.classList.add('btn', 'btn-success', 'mt-3', 'w-100');
    restartButton.addEventListener('click', () => {
        // Reset for a new quiz
        resultsScreen.classList.add('hidden');
        resultsContainerEl.innerHTML = ''; // Clear results content
        startScreen.classList.remove('hidden'); // Show start screen
        
        currentQuestionIndex = 0; 
        // quizQuestions will be repopulated by selectQuizQuestions on next start
        // allQuestions remains loaded unless an error forces a re-fetch or page reload
        
        // Reset UI elements that might show old quiz data
        quizScreen.classList.add('hidden'); // Hide quiz screen
        nextBtn.classList.add('hidden'); // Hide next button
        questionTextEl.textContent = ''; // Clear question text
        questionCounterEl.textContent = ''; // Clear counter
        optionsContainerEl.innerHTML = ''; // Clear options
    });
    resultsContainerEl.appendChild(restartButton);
}

startBtn.addEventListener('click', async () => {
    // Clear previous results and hide results screen (if coming from a restart)
    resultsContainerEl.innerHTML = ''; 
    resultsScreen.classList.add('hidden');

    // Set UI to loading state
    startScreen.classList.add('hidden'); // Hide start button immediately
    quizScreen.classList.remove('hidden'); // Show quiz area for loading message/content
    questionTextEl.textContent = 'Loading questions, please wait...'; 
    questionCounterEl.textContent = '';
    optionsContainerEl.innerHTML = '';
    nextBtn.classList.add('hidden');

    try {
        // Load questions if not already loaded, or if a re-fetch is desired.
        // For simplicity, assume allQuestions is populated once. If it's empty, load.
        if (allQuestions.length === 0) {
            await loadQuestions(); // This might throw an error, which will be caught below
        }
        
        // Now, select questions for the quiz (even if allQuestions was already populated)
        selectQuizQuestions();

        if (quizQuestions.length === 0 && allQuestions.length > 0) { // Check allQuestions.length to make sure it's not a load failure.
            // This means selectQuizQuestions couldn't form a quiz, even if allQuestions loaded.
            // This could be due to insufficient questions per subject criteria.
            throw new Error("Not enough questions available in 'questions.json' to form the quiz according to subject requirements. Please check the question bank.");
        } else if (quizQuestions.length === 0 && allQuestions.length === 0) {
            // This case means loadQuestions failed and already set an error message.
            // No need to throw a new generic error here, the specific one from loadQuestions is better.
            // The catch block below will handle UI if not already handled by loadQuestions error path.
            return; // Exit, as loadQuestions already handled the UI for its failure.
        }
        
        // If everything is fine, proceed to display the first question
        currentQuestionIndex = 0;
        // quizScreen is already visible from loading state
        displayQuestion();

    } catch (error) {
        // Errors from loadQuestions() or the new error thrown above will be caught here.
        // loadQuestions() itself updates questionTextEl with specific error messages.
        // If the error is from selectQuizQuestions failing and not a load error:
        if (!questionTextEl.textContent.startsWith("Error loading quiz:")) { 
             questionTextEl.textContent = `Failed to start quiz: ${error.message}`;
        }
        // Ensure UI reflects that the quiz cannot start or continue
        optionsContainerEl.innerHTML = ''; 
        nextBtn.classList.add('hidden'); 
        questionCounterEl.textContent = 'Error';
        // Optionally, show start button again to allow retry after fixing questions.json
        // startScreen.classList.remove('hidden'); 
        // However, if loadQuestions itself failed, it already hid the start button.
        // Re-showing startScreen might be confusing if the core issue (e.g. bad questions.json) isn't fixed.
        // For now, if an error occurs, the user would likely need to refresh or address the questions.json.
    }
});

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});
// END OF SCRIPT.JS
