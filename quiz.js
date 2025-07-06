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
    
    // Font size variables (with default values)
    let questionFontSize = 1.8; // rem - larger default for projector
    let optionFontSize = 1.5;   // rem - larger default for projector

    // Initialize the app
    loadQuestions();

    // Load saved settings from localStorage
    function loadSettings() {
        // Language
        const savedLanguage = localStorage.getItem('quizLanguage');
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            updateLanguageButtonText();
        }
        
        // Font sizes
        const savedQuestionSize = localStorage.getItem('questionFontSize');
        const savedOptionSize = localStorage.getItem('optionFontSize');
        if (savedQuestionSize) questionFontSize = parseFloat(savedQuestionSize);
        if (savedOptionSize) optionFontSize = parseFloat(savedOptionSize);
        
        // Set initial slider value (average of both sizes)
        fontSizeSlider.value = ((questionFontSize + optionFontSize) / 2).toFixed(1);
    }

    // Update language toggle button text
    function updateLanguageButtonText() {
        languageToggle.textContent = currentLanguage === 'english' ? 'മലയാളം' : 'English';
        if (resultsLanguageToggle) {
            resultsLanguageToggle.textContent = currentLanguage === 'english' ? 'മലയാളം' : 'English';
        }
    }

    // Font size adjustment functions
    function updateFontSizes() {
        // Calculate new sizes based on slider position (1-5)
        const sliderValue = parseFloat(fontSizeSlider.value);
        questionFontSize = 1.0 + (sliderValue * 0.8); // 1.0-5.0rem (wider range for projector)
        optionFontSize = 0.9 + (sliderValue * 0.7);   // 0.9-4.4rem
        
        // Save to localStorage
        localStorage.setItem('questionFontSize', questionFontSize);
        localStorage.setItem('optionFontSize', optionFontSize);
        
        // Apply to current elements
        applyFontSizes();
    }

    function applyFontSizes() {
        // Apply to question text
        if (questionText) {
            questionText.style.fontSize = `${questionFontSize}rem`;
            questionText.style.lineHeight = `${questionFontSize + 0.5}rem`;
        }
        
        // Apply to options
        const optionContents = document.querySelectorAll('.option-content');
        optionContents.forEach(option => {
            option.style.fontSize = `${optionFontSize}rem`;
            option.style.lineHeight = `${optionFontSize + 0.3}rem`;
        });
        
        // Apply to current results if on results screen
        if (resultsScreen.style.display === 'block') {
            const answerQuestions = answersContainer.querySelectorAll('.answer-item .fw-bold');
            answerQuestions.forEach(q => {
                q.style.fontSize = `${questionFontSize}rem`;
                q.style.lineHeight = `${questionFontSize + 0.5}rem`;
            });
            
            const answerOptions = answersContainer.querySelectorAll('.answer-item div:not(.fw-bold)');
            answerOptions.forEach(opt => {
                opt.style.fontSize = `${optionFontSize}rem`;
                opt.style.lineHeight = `${optionFontSize + 0.3}rem`;
            });
        }
    }

    // Load questions from JSON file
    async function loadQuestions() {
        try {
            // Load settings first
            loadSettings();
            
            // Then load questions
            const response = await fetch('questions.json');
            if (!response.ok) throw new Error('Failed to load questions');
            questions = await response.json();
            
            initializeChapterSelection();
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Failed to load questions. Please try again later.');
        }
    }

    // Initialize chapter selection checkboxes
    function initializeChapterSelection() {
        chapterSelection.innerHTML = '<h5 class="mb-3">Select Chapters:</h5>';
        
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
    }

    // Get selected chapters from checkboxes
    function getSelectedChapters() {
        const checkboxes = document.querySelectorAll('.chapter-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    // Start the quiz
    function startQuiz() {
        selectedChapters = getSelectedChapters();
        
        if (selectedChapters.length === 0) {
            alert('Please select at least one chapter');
            return;
        }
        
        // Start timer
        startTime = new Date();
        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
        
        // Initialize quiz
        currentQuestionIndex = 0;
        answerRevealed = false;
        selectedQuestions = selectQuestionsInOrder();
        
        if (selectedQuestions.length === 0) {
            alert('No questions found in selected chapters');
            return;
        }
        
        // Show quiz screen
        startScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        quizScreen.style.display = 'block';
        
        loadQuestion();
    }

    // Select questions in the specified subject order
    function selectQuestionsInOrder() {
        let filteredQuestions = questions.filter(q => selectedChapters.includes(q.chapter));
        
        // Group by subject in required order
        const part1Malayalam = getRandomElements(filteredQuestions.filter(q => q.subject === "Part I Malayalam"), 5);
        const part2Malayalam = getRandomElements(filteredQuestions.filter(q => q.subject === "Part II Malayalam"), 5);
        const maths = getRandomElements(filteredQuestions.filter(q => q.subject === "Maths"), 10);
        const english = getRandomElements(filteredQuestions.filter(q => q.subject === "English"), 5);
        const basicScience = getRandomElements(filteredQuestions.filter(q => q.subject === "Basic Science"), 10);
        const socialScience = getRandomElements(filteredQuestions.filter(q => q.subject === "Social Science"), 10);
        
        return [
            ...part1Malayalam,
            ...part2Malayalam,
            ...maths,
            ...english,
            ...basicScience,
            ...socialScience
        ].filter(q => q !== undefined);
    }

    // Get random elements from array
    function getRandomElements(array, count) {
        if (array.length === 0) return [];
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // Update timer display
    function updateTimer() {
        const now = new Date();
        const elapsed = new Date(now - startTime);
        const minutes = elapsed.getUTCMinutes().toString().padStart(2, '0');
        const seconds = elapsed.getUTCSeconds().toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    // Format time taken for display
    function formatTimeTaken(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    // Load and display current question
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
        questionText.style.lineHeight = `${questionFontSize + 0.5}rem`;
        
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
            optionLetter.style.fontSize = `${optionFontSize}rem`;
            
            const optionContent = document.createElement('div');
            optionContent.className = 'option-content';
            optionContent.style.fontSize = `${optionFontSize}rem`;
            optionContent.style.lineHeight = `${optionFontSize + 0.3}rem`;
            
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
        
        // Scroll to top of question
        window.scrollTo(0, 0);
    }

    // Display question image with zoom functionality
    function displayQuestionImage(imagePath) {
        questionImageContainer.innerHTML = '';
        
        if (imagePath) {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = "Question image";
            img.className = "question-image img-fluid rounded";
            
            // Add zoom functionality
            img.addEventListener('click', function() {
                this.classList.toggle('zoomed');
            });
            
            questionImageContainer.appendChild(img);
            questionImageContainer.style.display = 'block';
        } else {
            questionImageContainer.style.display = 'none';
        }
    }

    // Toggle between English and Malayalam
    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('quizLanguage', currentLanguage);
        updateLanguageButtonText();
        updateQuestionLanguage();
    }

    // Toggle language for results screen
    function toggleResultsLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('quizLanguage', currentLanguage);
        updateLanguageButtonText();
        showResults();
    }

    // Update question language
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
        const options = document.querySelectorAll('.option-content');
        options.forEach((option, index) => {
            if (currentLanguage === 'malayalam' && selectedQuestions[currentQuestionIndex][`malayalam_option${index + 1}`]) {
                option.textContent = selectedQuestions[currentQuestionIndex][`malayalam_option${index + 1}`];
                option.classList.add('malayalam-text');
            } else {
                option.textContent = selectedQuestions[currentQuestionIndex][`option${index + 1}`];
                option.classList.remove('malayalam-text');
            }
        });
    }

    // Reveal the correct answer
    function revealAnswer() {
        answerRevealed = true;
        const question = selectedQuestions[currentQuestionIndex];
        const options = document.querySelectorAll('.option');
        
        options.forEach(option => {
            const optionIndex = parseInt(option.dataset.index);
            const optionContent = option.querySelector('.option-content').textContent;
            
            if (currentLanguage === 'malayalam' && question.malayalam_answer) {
                if (optionContent === question.malayalam_answer) {
                    option.classList.add('correct-answer');
                }
            } else if (optionContent === question.answer) {
                option.classList.add('correct-answer');
            }
        });
        
        revealBtn.textContent = 'Answer Revealed';
        revealBtn.disabled = true;
    }

    // Move to next question
    function nextQuestion() {
        if (currentQuestionIndex < selectedQuestions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            showResults();
        }
    }

    // Move to previous question
    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    }

    // Show results screen
    function showResults() {
        // Stop timer
        clearInterval(timerInterval);
        const endTime = new Date();
        const timeTaken = endTime - startTime;
        
        // Show time taken
        timeTakenDisplay.textContent = `Time taken: ${formatTimeTaken(timeTaken)}`;
        timeTakenDisplay.style.fontSize = `${questionFontSize}rem`;
        
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
            questionText.style.lineHeight = `${questionFontSize + 0.5}rem`;
            questionText.textContent = `${index + 1}. ${currentLanguage === 'malayalam' && question.malayalam_question ? question.malayalam_question : question.question}`;
            answerItem.appendChild(questionText);
            
            // Options
            for (let i = 1; i <= 4; i++) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'ms-3';
                optionDiv.style.fontSize = `${optionFontSize}rem`;
                optionDiv.style.lineHeight = `${optionFontSize + 0.3}rem`;
                
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

    // Restart the quiz
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

    // Event listeners
    fontSizeSlider.addEventListener('input', updateFontSizes);
});