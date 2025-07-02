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

    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedQuestions = [];
    let answerRevealed = false;
    let selectedChapters = [];
    let currentLanguage = 'english'; // 'english' or 'malayalam'

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
        
        // Get all unique chapters from questions
        const chapters = [...new Set(questions.map(q => q.chapter))].sort();
        
        if (chapters.length === 0) {
            chapterSelection.innerHTML = '<p>No chapters found in questions data.</p>';
            return;
        }
        
        // Create checkboxes for each chapter
        chapters.forEach(chapter => {
            const div = document.createElement('div');
            div.className = 'form-check';
            
            const input = document.createElement('input');
            input.className = 'form-check-input chapter-checkbox';
            input.type = 'checkbox';
            input.value = chapter;
            input.id = `chapter-${chapter.replace(/\s+/g, '-')}`;
            input.checked = true;
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = input.id;
            label.textContent = chapter;
            
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
        return Array.from(checkboxes).map(cb => cb.value);
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
        
        selectedQuestions = selectRandomQuestions();
        
        if (selectedQuestions.length === 0) {
            alert('No questions found in selected chapters');
            return;
        }
        
        startScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        loadQuestion();
    }

    function selectRandomQuestions() {
        let filteredQuestions = questions.filter(q => selectedChapters.includes(q.chapter));
        
        const part1Malayalam = filteredQuestions.filter(q => q.subject === "Part I Malayalam");
        const part2Malayalam = filteredQuestions.filter(q => q.subject === "Part II Malayalam");
        const english = filteredQuestions.filter(q => q.subject === "English");
        const maths = filteredQuestions.filter(q => q.subject === "Maths");
        const basicScience = filteredQuestions.filter(q => q.subject === "Basic Science");
        const socialScience = filteredQuestions.filter(q => q.subject === "Social Science");
        
        const selected = [
            ...getRandomElements(part1Malayalam, 5),
            ...getRandomElements(part2Malayalam, 5),
            ...getRandomElements(english, 5),
            ...getRandomElements(maths, 10),
            ...getRandomElements(basicScience, 10),
            ...getRandomElements(socialScience, 10)
        ];
        
        return selected;
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
        questionImageContainer.innerHTML = '';
        
        if (imagePath) {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = "Question image";
            img.className = "img-fluid rounded";
            img.style.maxHeight = "300px";
            questionImageContainer.appendChild(img);
        }
    }

    function loadQuestion() {
        answerRevealed = false;
        const question = selectedQuestions[currentQuestionIndex];
        
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
        subjectDisplay.textContent = question.subject;
        chapterDisplay.textContent = question.chapter;
        
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
            quizScreen.classList.add('hidden');
            resultsScreen.classList.remove('hidden');
        }
    }

    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    }
});
