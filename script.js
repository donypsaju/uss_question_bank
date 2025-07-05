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
    const languageToggle = document.getElementById('language-toggle');
    const resultsLanguageToggle = document.getElementById('results-language-toggle');
    const questionImageContainer = document.getElementById('question-image-container');
    const answersContainer = document.getElementById('answers-container');
    const timerDisplay = document.getElementById('timer');
    const timeTakenDisplay = document.getElementById('time-taken');
    const fontSizeSlider = document.getElementById('font-size-slider');

    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedQuestions = [];
    let answerRevealed = false;
    let selectedChapters = [];
    let currentLanguage = 'english';
    let startTime;
    let timerInterval;
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    // Font size variables
    let questionFontSize = 1.3; // rem
    let optionFontSize = 1.1; // rem

    // Initialize the app
    loadQuestions();

    // Load saved font sizes from localStorage
    const savedQuestionSize = localStorage.getItem('questionFontSize');
    const savedOptionSize = localStorage.getItem('optionFontSize');
    if (savedQuestionSize) questionFontSize = parseFloat(savedQuestionSize);
    if (savedOptionSize) optionFontSize = parseFloat(savedOptionSize);
    
    // Set initial slider value (average of both sizes)
    fontSizeSlider.value = ((questionFontSize + optionFontSize) / 2).toFixed(1);

    // Event listeners
    startBtn.addEventListener('click', startQuiz);
    restartBtn.addEventListener('click', restartQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    revealBtn.addEventListener('click', revealAnswer);
    languageToggle.addEventListener('click', toggleLanguage);
    resultsLanguageToggle.addEventListener('click', toggleResultsLanguage);
    fontSizeSlider.addEventListener('input', updateFontSizes);

    function updateFontSizes() {
        // Calculate new sizes based on slider position (1-5)
        const sliderValue = parseFloat(fontSizeSlider.value);
        questionFontSize = 1.0 + (sliderValue * 0.5); // 1.0-3.5rem
        optionFontSize = 0.9 + (sliderValue * 0.4);   // 0.9-2.9rem
        
        // Save to localStorage
        localStorage.setItem('questionFontSize', questionFontSize);
        localStorage.setItem('optionFontSize', optionFontSize);
        
        // Apply to current elements
        applyFontSizes();
    }

    function applyFontSizes() {
        // Apply to question text
        questionText.style.fontSize = `${questionFontSize}rem`;
        
        // Apply to options
        const optionContents = document.querySelectorAll('.option-content');
        optionContents.forEach(option => {
            option.style.fontSize = `${optionFontSize}rem`;
        });
        
        // Apply to current results if on results screen
        if (resultsScreen.style.display === 'block') {
            const answerQuestions = answersContainer.querySelectorAll('.answer-item .fw-bold');
            answerQuestions.forEach(q => {
                q.style.fontSize = `${questionFontSize}rem`;
            });
            
            const answerOptions = answersContainer.querySelectorAll('.answer-item div:not(.fw-bold)');
            answerOptions.forEach(opt => {
                opt.style.fontSize = `${optionFontSize}rem`;
            });
        }
    }

    async function loadQuestions() {
        try {
            // Load language preference from localStorage
            const savedLanguage = localStorage.getItem('quizLanguage');
            if (savedLanguage) {
                currentLanguage = savedLanguage;
                updateLanguageButtonText();
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
        }
    }

    // ... (rest of the existing functions remain the same until loadQuestion)

    function loadQuestion() {
        answerRevealed = false;
        const question = selectedQuestions[currentQuestionIndex];
        
        // Update question counter and subject info
        questionCounter.textContent = `Q${currentQuestionIndex + 1}/${selectedQuestions.length}`;
        subjectDisplay.textContent = question.subject;
        chapterDisplay.textContent = question.chapter;
        
        // Set question text
        if (currentLanguage === 'malayalam' && question.malayalam_question) {
            questionText.textContent = question.malayalam_question;
            questionText.classList.add('malayalam-text');
        } else {
            questionText.textContent = question.question;
            questionText.classList.remove('malayalam-text');
        }
        
        // Apply current font size
        questionText.style.fontSize = `${questionFontSize}rem`;
        
        // Display question image if exists
        displayQuestionImage(question.image);
        
        // Create options with A, B, C, D labels
        optionsContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.dataset.index = i + 1;
            
            const optionLetter = document.createElement('div');
            optionLetter.className = 'option-letter';
            optionLetter.textContent = optionLetters[i];
            
            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';
            optionContent.style.fontSize = `${optionFontSize}rem`;
            
            if (currentLanguage === 'malayalam' && question[`malayalam_option${i + 1}`]) {
                optionContent.textContent = question[`malayalam_option${i + 1}`];
                optionContent.classList.add('malayalam-text');
            } else {
                optionContent.textContent = question[`option${i + 1}`];
                optionContent.classList.remove('malayalam-text');
            }
            
            optionDiv.appendChild(optionLetter);
            optionDiv.appendChild(optionContent);
            optionsContainer.appendChild(optionDiv);
        }
        
        // Update navigation buttons
        prevBtn.classList.toggle('d-none', currentQuestionIndex === 0);
        nextBtn.textContent = currentQuestionIndex === selectedQuestions.length - 1 ? 'Finish' : 'Next';
        revealBtn.textContent = 'Reveal Answer';
        revealBtn.disabled = false;
    }

    // ... (rest of the existing functions remain the same until showResults)

    function showResults() {
        // Stop timer
        clearInterval(timerInterval);
        const endTime = new Date();
        const timeTaken = endTime - startTime;
        
        // Show time taken
        timeTakenDisplay.textContent = `Time taken: ${formatTimeTaken(timeTaken)}`;
        
        // Show results screen
        startScreen.style.display = 'none';
        quizScreen.style.display = 'none';
        resultsScreen.style.display = 'block';
        
        // Generate answer list with proper font sizes
        answersContainer.innerHTML = '';
        selectedQuestions.forEach((question, index) => {
            const answerItem = document.createElement('div');
            answerItem.className = 'answer-item';
            
            // Question text
            const questionText = document.createElement('div');
            questionText.className = 'fw-bold mb-2';
            questionText.style.fontSize = `${questionFontSize}rem`;
            questionText.textContent = `${index + 1}. ${currentLanguage === 'malayalam' && question.malayalam_question ? question.malayalam_question : question.question}`;
            answerItem.appendChild(questionText);
            
            // Options
            for (let i = 1; i <= 4; i++) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'ms-3';
                optionDiv.style.fontSize = `${optionFontSize}rem`;
                
                const optionText = currentLanguage === 'malayalam' && question[`malayalam_option${i}`] 
                    ? question[`malayalam_option${i}`] 
                    : question[`option${i}`];
                
                optionDiv.textContent = `${optionLetters[i-1]}. ${optionText}`;
                
                // Highlight correct answer
                if (currentLanguage === 'malayalam' && question.malayalam_answer) {
                    if (question[`malayalam_option${i}`] === question.malayalam_answer) {
                        optionDiv.style.fontWeight = 'bold';
                        optionDiv.style.color = 'green';
                    }
                } else if (question[`option${i}`] === question.answer) {
                    optionDiv.style.fontWeight = 'bold';
                    optionDiv.style.color = 'green';
                }
                
                answerItem.appendChild(optionDiv);
            }
            
            answersContainer.appendChild(answerItem);
        });
        
        // Scroll to top of results
        window.scrollTo(0, 0);
    }

    function restartQuiz() {
        // Clear localStorage
        localStorage.removeItem('quizLanguage');
        
        // Reset to start screen
        startScreen.style.display = 'flex';
        quizScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        
        // Reset language to default
        currentLanguage = 'english';
        updateLanguageButtonText();
    }
});
