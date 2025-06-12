// Assume the rest of script.js (variables, other functions) is already defined as in previous steps.
// We are focusing on replacing the showResults placeholder.

const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');

const questionCounterEl = document.getElementById('question-counter');
const questionTextEl = document.getElementById('question-text');
const optionsContainerEl = document.getElementById('options-container');
const resultsContainerEl = document.getElementById('results-container');

let allQuestions = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
const totalQuizQuestions = 45; 

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestions = await response.json();
        selectQuizQuestions();
    } catch (error) {
        console.error("Could not load questions:", error);
        questionTextEl.textContent = "Failed to load questions. Please try again later.";
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        optionsContainerEl.innerHTML = ''; 
        nextBtn.classList.add('hidden'); 
        questionCounterEl.textContent = ''; 
    }
}

function selectQuizQuestions() {
    quizQuestions = []; 

    const subjectCounts = {
        "Part I Malayalam": 5,
        "Part II Malayalam": 5,
        "Maths": 10,
        "English": 5,
        "Basic Science": 10,
        "Social Science": 10
    };

    let selectedQuestionObjects = [];
    for (const subject in subjectCounts) {
        let questionsFromSubject = allQuestions.filter(q => q.subject === subject);
        shuffleArray(questionsFromSubject); 
        selectedQuestionObjects.push(...questionsFromSubject.slice(0, subjectCounts[subject]));
    }

    shuffleArray(selectedQuestionObjects); 
    quizQuestions = selectedQuestionObjects;

    if (quizQuestions.length < totalQuizQuestions && allQuestions.length > 0) { 
        console.warn(`Warning: Not enough questions to meet the criteria for all subjects. Selected ${quizQuestions.length} questions out of the desired ${totalQuizQuestions}.`);
    }
    console.log("Selected quiz questions:", quizQuestions);
}

function displayQuestion() {
    if (currentQuestionIndex < quizQuestions.length) {
        const currentQ = quizQuestions[currentQuestionIndex];
        questionCounterEl.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
        questionTextEl.textContent = currentQ.question;
        optionsContainerEl.innerHTML = ''; 

        currentQ.options.forEach(optionText => {
            const optionButton = document.createElement('button');
            optionButton.textContent = optionText;
            optionButton.classList.add('btn', 'btn-outline-primary', 'mb-2', 'w-100');
            optionsContainerEl.appendChild(optionButton);
        });
        nextBtn.classList.remove('hidden');
    } else {
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
        questionP.innerHTML = `<strong>Q ${index + 1}:</strong> ${q.question}`;
        
        const answerP = document.createElement('p');
        answerP.innerHTML = `<strong>Answer:</strong> <span class="correct-answer">${q.answer}</span>`;

        resultItem.appendChild(questionP);
        resultItem.appendChild(answerP);
        resultsContainerEl.appendChild(resultItem);
    });
    
    // Optional: Add a restart button dynamically or ensure it's in HTML and make it visible
    // For now, let's add a simple restart button here dynamically to allow re-taking the quiz.
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Quiz';
    restartButton.classList.add('btn', 'btn-success', 'mt-3', 'w-100');
    restartButton.addEventListener('click', () => {
        resultsScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        // Resetting allQuestions is not necessary unless questions.json could change during runtime
        // quizQuestions will be re-selected on start.
        // currentQuestionIndex will be reset on start.
    });
    resultsContainerEl.appendChild(restartButton);
}

startBtn.addEventListener('click', async () => {
    await loadQuestions(); 
    
    if (allQuestions.length === 0) {
        return;
    }

    if (quizQuestions.length === 0) { 
        questionTextEl.textContent = "Not enough questions available in 'questions.json' to form the quiz based on subject requirements. Please check the question bank.";
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        optionsContainerEl.innerHTML = '';
        nextBtn.classList.add('hidden');
        questionCounterEl.textContent = '';
        return;
    }
    
    currentQuestionIndex = 0;
    startScreen.classList.add('hidden');
    resultsScreen.classList.add('hidden'); // Ensure results are hidden on new start
    quizScreen.classList.remove('hidden');
    
    displayQuestion();
});

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});
