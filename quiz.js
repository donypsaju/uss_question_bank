document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultsScreen = document.getElementById('results-screen');
    const startBtn = document.getElementById('start-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const revealBtn = document.getElementById('reveal-btn');
    const restartBtn = document.getElementById('restart-btn');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const questionCounter = document.getElementById('question-counter');
    const subjectDisplay = document.getElementById('subject-display');
    const chapterDisplay = document.getElementById('chapter-display');
    const chapterSelection = document.getElementById('chapter-selection');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const languageToggle = document.getElementById('language-toggle');
    const questionImageContainer = document.getElementById('question-image-container');
    const answersContainer = document.getElementById('answers-container');

    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedQuestions = [];
    let answerRevealed = false;
    let selectedChapters = [];
    let currentLanguage = 'english';

    // Initialize the app
    loadQuestions();

    // Event listeners
    startBtn.addEventListener('click', startQuiz);
    restartBtn.addEventListener('click', restartQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    revealBtn.addEventListener('click', revealAnswer);
    languageToggle.addEventListener('click', toggleLanguage);

    async function loadQuestions() {
        try {
            loadingSpinner.style.display = 'block';
            startBtn.disabled = true;
            
            // Load language preference from localStorage
            const savedLanguage = localStorage.getItem('quizLanguage');
            if (savedLanguage) {
                currentLanguage = savedLanguage;
                languageToggle.textContent = currentLanguage === 'english' ? 'മലയാളം' : 'English';
            }
            
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error('Failed to load questions');
            }
            questions = await response.json();
            
            initializeChapterSelection();
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions. Please try again later.');
        } finally {
            loadingSpinner.style.display = 'none';
            startBtn.disabled = false;
        }
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        languageToggle.textContent = currentLanguage === 'english' ? 'മലയാളം' : 'English';
        
        // Save language preference to localStorage
        localStorage.setItem('quizLanguage', currentLanguage);
        
        updateQuestionLanguage();
    }

    function updateQuestionLanguage() {
        const question = selectedQuestions[currentQuestionIndex];
        
        // Update question text
        if (currentLanguage === 'malayalam' && question.malayalam_question) {
            questionText.textContent = question.malayalam_question;
            questionText.classList.add('malayalam-text');
        } else {
            questionText.textContent = question.question;
            questionText.classList.remove('malayalam-text');
        }
        
        // Update options
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            const englishOption = option.querySelector('.english-option');
            const malayalamOption = option.querySelector('.malayalam-option');
            
            if (currentLanguage === 'malayalam' && question[`malayalam_option${index + 1}`]) {
                englishOption.classList.add('hidden');
                malayalamOption.classList.remove('hidden');
                malayalamOption.textContent = question[`malayalam_option${index + 1}`];
            } else {
                englishOption.classList.remove('hidden');
                malayalamOption.classList.add('hidden');
                englishOption.textContent = question[`option${index + 1}`];
            }
        });
    }

    function initializeChapterSelection() {
        // Clear existing checkboxes
        chapterSelection.innerHTML = '<h5>Select Chapters:</h5>';
        
        // Get all unique chapter numbers from questions
        const chapters = [...new Set(questions.map(q => q.chapter))].sort((a, b) => a - b);
        
        if (chapters.length === 0) {
            chapterSelection.innerHTML = '<p>No chapters found in questions data.</p>';
            return;
        }
        
        // Create checkboxes for each chapter number
        chapters.forEach(chapter => {
            const div = document.createElement('div');
            div.className = 'form-check';
            
            const input = document.createElement('input');
            input.className = 'form-check-input chapter-checkbox';
            input.type = 'checkbox';
            input.value = chapter;
            input.id = `chapter-${chapter}`;
            input.checked = true;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = input.id;
            label.textContent = `Chapter ${chapter}`;
            
            div.appendChild(input);
            div.appendChild(label);
            chapterSelection.appendChild(div);
        });
        
        // Add "Select All" / "Deselect All" buttons
        const selectAllDiv = document.createElement('div');
        selectAllDiv.className = 'mt-2';
        
        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'btn btn-sm btn-outline-primary me-2';
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.chapter-checkbox').forEach(cb => {
                cb.checked = true;
            });
        });
        
        const deselectAllBtn = document.createElement('button');
        deselectAllBtn.className = 'btn btn-sm btn-outline-secondary';
        deselectAllBtn.textContent = 'Deselect All';
        deselectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.chapter-checkbox').forEach(cb => {
                cb.checked = false;
            });
        });
        
        selectAllDiv.appendChild(selectAllBtn);
        selectAllDiv.appendChild(deselectAllBtn);
        chapterSelection.appendChild(selectAllDiv);
    }

    function getSelectedChapters() {
        const checkboxes = document.querySelectorAll('.chapter-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    function restartQuiz() {
        startScreen.classList.remove('hidden');
        resultsScreen.classList.add('hidden');
        quizScreen.classList.add('hidden');
        currentLanguage = 'english';
        languageToggle.textContent = 'മലയാളം';
    }

    function startQuiz() {
        selectedChapters = getSelectedChapters();
        
        if (selectedChapters.length === 0) {
            alert('Please select at least one chapter');
            return;
        }
        
        currentQuestionIndex = 0;
        answerRevealed = false;
        currentLanguage = 'english';
        languageToggle.textContent = 'മലയാളം';
        
        selectedQuestions = selectQuestionsInOrder();
        
        if (selectedQuestions.length === 0) {
            alert('No questions found in selected chapters');
            return;
        }
        
        startScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        loadQuestion();
    }

    function selectQuestionsInOrder() {
        let filteredQuestions = questions.filter(q => selectedChapters.includes(q.chapter));
        
        // Group by subject in the required order
        const part1Malayalam = getRandomElements(filteredQuestions.filter(q => q.subject === "Part I Malayalam"), 5);
        const part2Malayalam = getRandomElements(filteredQuestions.filter(q => q.subject === "Part II Malayalam"), 5);
        const maths = getRandomElements(filteredQuestions.filter(q => q.subject === "Maths"), 10);
        const english = getRandomElements(filteredQuestions.filter(q => q.subject === "English"), 5);
        const basicScience = getRandomElements(filteredQuestions.filter(q => q.subject === "Basic Science"), 10);
        const socialScience = getRandomElements(filteredQuestions.filter(q => q.subject === "Social Science"), 10);
        
        // Combine in the required order
        return [
            ...part1Malayalam,
            ...part2Malayalam,
            ...maths,
            ...english,
            ...basicScience,
            ...socialScience
        ].filter(q => q !== undefined);
    }

    function getRandomElements(array, count) {
        if (array.length === 0) return [];
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    function displayQuestionImage(imagePath) {
    // Clear previous image
    questionImageContainer.innerHTML = '';
    
    if (imagePath) {
        // Show container and add image
        questionImageContainer.classList.remove('hidden');
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = "Question image";
        img.className = "question-image img-fluid rounded";
        img.style.maxHeight = "300px";
        
        // Add zoom functionality
        img.addEventListener('click', function() {
            this.classList.toggle('zoomed');
        });
        
        questionImageContainer.appendChild(img);
    } else {
        // Hide the image container if there's no image
        questionImageContainer.classList.add('hidden');
    }
}


    function loadQuestion() {
        answerRevealed = false;
        const question = selectedQuestions[currentQuestionIndex];
        
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
        subjectDisplay.textContent = question.subject;
        chapterDisplay.textContent = `Chapter ${question.chapter}`;
        
        // Set question text based on current language
        if (currentLanguage === 'malayalam' && question.malayalam_question) {
            questionText.textContent = question.malayalam_question;
            questionText.classList.add('malayalam-text');
        } else {
            questionText.textContent = question.question;
            questionText.classList.remove('malayalam-text');
        }
        
        // Display question image if exists
        displayQuestionImage(question.image);
        
        // Reset options styling and set content
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            option.classList.remove('correct-answer');
            
            const englishOption = option.querySelector('.english-option');
            const malayalamOption = option.querySelector('.malayalam-option');
            
            englishOption.textContent = question[`option${index + 1}`];
            
            if (question[`malayalam_option${index + 1}`]) {
                malayalamOption.textContent = question[`malayalam_option${index + 1}`];
            }
            
            if (currentLanguage === 'malayalam' && question[`malayalam_option${index + 1}`]) {
                englishOption.classList.add('hidden');
                malayalamOption.classList.remove('hidden');
            } else {
                englishOption.classList.remove('hidden');
                malayalamOption.classList.add('hidden');
            }
        });
        
        prevBtn.classList.toggle('hidden', currentQuestionIndex === 0);
        nextBtn.textContent = currentQuestionIndex === selectedQuestions.length - 1 ? 'Finish' : 'Next';
        revealBtn.textContent = 'Reveal Answer';
        revealBtn.disabled = false;
    }

    function revealAnswer() {
        answerRevealed = true;
        const question = selectedQuestions[currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        
        options.forEach(option => {
            const englishOption = option.querySelector('.english-option');
            const optionText = currentLanguage === 'malayalam' && question[`malayalam_option${englishOption.dataset.index}`] ? 
                option.querySelector('.malayalam-option').textContent : 
                englishOption.textContent;
            
            if (optionText === (currentLanguage === 'malayalam' && question.malayalam_answer ? question.malayalam_answer : question.answer)) {
                option.classList.add('correct-answer');
            }
        });
        
        revealBtn.textContent = 'Answer Revealed';
        revealBtn.disabled = true;
    }

    function nextQuestion() {
        if (currentQuestionIndex < selectedQuestions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            showResults();
        }
    }

    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    }

    function showResults() {
        // Clear language preference from localStorage when quiz is completed
        localStorage.removeItem('quizLanguage');
        
        quizScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        
        answersContainer.innerHTML = '';
        
        selectedQuestions.forEach((question, index) => {
            const answerItem = document.createElement('div');
            answerItem.className = 'answer-item';
            
            // Show question in current language
            const questionText = currentLanguage === 'malayalam' && question.malayalam_question 
                ? question.malayalam_question 
                : question.question;
            
            const questionNumber = document.createElement('h5');
            questionNumber.textContent = `${index + 1}. ${questionText}`;
            
            const optionsList = document.createElement('div');
            optionsList.className = 'ms-3';
            
            // Determine correct answer
            let correctOptionIndex = -1;
            const optionLetters = ['A', 'B', 'C', 'D'];
            
            // Add all options in current language
            for (let i = 1; i <= 4; i++) {
                const optionDiv = document.createElement('div');
                let optionText;
                
                if (currentLanguage === 'malayalam' && question[`malayalam_option${i}`]) {
                    optionText = question[`malayalam_option${i}`];
                } else {
                    optionText = question[`option${i}`];
                }
                
                optionDiv.textContent = `${optionLetters[i-1]}. ${optionText}`;
                
                // Check if this is the correct answer
                if (currentLanguage === 'malayalam' && question.malayalam_answer) {
                    if (question[`malayalam_option${i}`] === question.malayalam_answer) {
                        optionDiv.style.fontWeight = 'bold';
                        optionDiv.style.color = 'green';
                    }
                } else if (question[`option${i}`] === question.answer) {
                    optionDiv.style.fontWeight = 'bold';
                    optionDiv.style.color = 'green';
                }
                
                optionsList.appendChild(optionDiv);
            }
            
            answerItem.appendChild(questionNumber);
            answerItem.appendChild(optionsList);
            answersContainer.appendChild(answerItem);
        });
    }
});