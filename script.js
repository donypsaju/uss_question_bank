document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const allScreens = document.querySelectorAll('main > div');
    const startBtn = document.getElementById('start-btn');
    const fullQuizBtn = document.getElementById('full-quiz-btn');
    const subjectQuizBtn = document.getElementById('subject-quiz-btn');
    const chapterCheckboxes = document.getElementById('chapter-checkboxes');
    const startFullQuizExecution = document.getElementById('start-full-quiz-execution');
    const subjectButtons = document.getElementById('subject-buttons');
    const subjectChapterTitle = document.getElementById('subject-chapter-title');
    const subjectChapterOptions = document.getElementById('subject-chapter-options');
    const startSubjectQuizExecution = document.getElementById('start-subject-quiz-execution');
    const questionCounter = document.getElementById('question-counter');
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const quizNavigation = document.getElementById('quiz-navigation');
    const nextBtn = document.getElementById('next-btn');
    const revealAnswerBtn = document.getElementById('reveal-answer-btn');
    const restartBtn = document.getElementById('restart-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const langSwitcher = document.getElementById('lang-switcher');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const questionImageContainer = document.getElementById('question-image-container');
    const questionImage = document.getElementById('question-image');
    const imageModalEl = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const bsImageModal = new bootstrap.Modal(imageModalEl);

    // --- STATE ---
    let allQuestions = [];
    let currentQuizQuestions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let questionDisplayStates = {};
    let currentLanguage = localStorage.getItem('language') || 'malayalam';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentFontSize = parseFloat(localStorage.getItem('fontSize')) || 20; // Default size in pixels
    let quizMode = '';

    // --- INITIALIZATION ---
    fetch('questions.json').then(response => response.json()).then(data => allQuestions = data);
    applyTheme();
    applyFontSize();
    updateLanguageSwitcherText();
    quizNavigation.classList.add('d-none'); // Hide nav buttons initially

    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', () => showScreen('quiz-options'));
    fullQuizBtn.addEventListener('click', () => { quizMode = 'quizTime'; setupFullQuiz(); });
    subjectQuizBtn.addEventListener('click', () => { quizMode = 'classTime'; setupSubjectQuiz(); });
    startFullQuizExecution.addEventListener('click', startFullQuiz);
    startSubjectQuizExecution.addEventListener('click', startSubjectQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    revealAnswerBtn.addEventListener('click', revealAnswer);
    restartBtn.addEventListener('click', restartQuiz);
    themeSwitcher.addEventListener('click', toggleTheme);
    langSwitcher.addEventListener('click', toggleLanguage);
    fontIncrease.addEventListener('click', () => changeFontSize(2)); // Increase by 2px
    fontDecrease.addEventListener('click', () => changeFontSize(-2)); // Decrease by 2px
    questionImage.addEventListener('click', () => { modalImg.src = questionImage.src; bsImageModal.show(); });

    // --- CORE FUNCTIONS ---
    function showScreen(screenId) {
        allScreens.forEach(screen => {
            if (screen.id === screenId) {
                screen.classList.remove('d-none');
            } else {
                screen.classList.add('d-none');
            }
        });
    }
    
    function setupFullQuiz() {
        const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => a - b);
        chapterCheckboxes.innerHTML = chapters.map(ch => `
            <label class="form-check-label btn btn-outline-secondary">
                <input class="form-check-input" type="checkbox" value="${ch}"> Chapter ${ch}
            </label>
        `).join('');
        showScreen('chapter-selection');
    }

    function setupSubjectQuiz() {
        const subjects = [...new Set(allQuestions.map(q => q.subject))];
        subjectButtons.innerHTML = subjects.map(sub => `<button class="btn btn-outline-primary m-2" data-subject="${sub}">${sub}</button>`).join('');
        subjectButtons.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => selectSubject(btn.dataset.subject));
        });
        showScreen('subject-selection');
    }

    function selectSubject(subject) {
        subjectChapterTitle.textContent = `Select questions for ${subject}`;
        const chapters = [...new Set(allQuestions.filter(q => q.subject === subject).map(q => q.chapter))].sort((a, b) => a - b);
        subjectChapterOptions.innerHTML = chapters.map(ch => `
            <div class="col-md-4 col-sm-6 d-flex align-items-center justify-content-between p-3 border rounded bg-body">
                <span>Chapter ${ch}:</span>
                <select class="form-select w-auto" data-chapter="${ch}" data-subject="${subject}">
                    <option value="0">0</option><option value="5">5</option><option value="10">10</option><option value="all">All</option>
                </select>
            </div>
        `).join('');
        showScreen('subject-chapter-selection');
    }

    function startFullQuiz() {
        const selectedChapters = Array.from(chapterCheckboxes.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
        const subjectOrder = ["Part I Malayalam", "Part II Malayalam", "Maths", "English", "Basic Science", "Social Science"];
        const questionCounts = { "Part I Malayalam": 5, "Part II Malayalam": 5, "Maths": 10, "English": 5, "Basic Science": 10, "Social Science": 10 };
        currentQuizQuestions = [];
        subjectOrder.forEach(subject => {
            let subjectQuestions = allQuestions.filter(q => q.subject === subject && (selectedChapters.length === 0 || selectedChapters.includes(q.chapter)));
            if (subjectQuestions.length < questionCounts[subject]) {
                subjectQuestions = allQuestions.filter(q => q.subject === subject);
            }
            currentQuizQuestions.push(...shuffleArray(subjectQuestions).slice(0, questionCounts[subject]));
        });
        startQuiz();
    }
    
    function startSubjectQuiz() {
        currentQuizQuestions = [];
        subjectChapterOptions.querySelectorAll('select').forEach(select => {
            const subject = select.dataset.subject;
            const chapter = parseInt(select.dataset.chapter);
            const count = select.value;
            if (count !== "0") {
                let chapterQuestions = allQuestions.filter(q => q.subject === subject && q.chapter === chapter);
                currentQuizQuestions.push(...shuffleArray(chapterQuestions).slice(0, count === 'all' ? undefined : parseInt(count)));
            }
        });
        currentQuizQuestions = shuffleArray(currentQuizQuestions);
        startQuiz();
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        userAnswers = Array(currentQuizQuestions.length).fill(null);
        questionDisplayStates = {};
        quizNavigation.classList.remove('d-none');
        if (quizMode === 'classTime') {
            revealAnswerBtn.classList.remove('d-none');
        } else {
            revealAnswerBtn.classList.add('d-none');
        }
        showScreen('quiz-container');
        showQuestion();
    }

    function showQuestion() {
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} / ${currentQuizQuestions.length}`;
        const question = currentQuizQuestions[currentQuestionIndex];
        const questionText = question[currentLanguage === 'english' ? 'question' : 'malayalam_question'];

        // --- FIX FOR HTML CHARACTERS IN QUESTION ---
        // Clear previous content
        questionEl.innerHTML = '';
        
        // Create and append the question number in bold
        const strongTag = document.createElement('strong');
        strongTag.textContent = `Q${currentQuestionIndex + 1}: `;
        questionEl.appendChild(strongTag);

        // Create and append the question text as a text node to prevent HTML parsing
        const textNode = document.createTextNode(questionText);
        questionEl.appendChild(textNode);
        // --- END OF FIX ---

        if (question.image && question.image !== "null") {
            questionImageContainer.classList.remove('d-none');
            questionImage.src = question.image;
        } else {
            questionImageContainer.classList.add('d-none');
        }

        const optionsToDisplay = ['option1', 'option2', 'option3', 'option4'].map(key => ({
            text: question[currentLanguage === 'english' ? key : `malayalam_${key}`],
            isAnswer: question[currentLanguage === 'english' ? key : `malayalam_${key}`] === question[currentLanguage === 'english' ? 'answer' : 'malayalam_answer']
        }));
        
        optionsEl.innerHTML = '';
        const shuffledOptions = shuffleArray(optionsToDisplay);
        questionDisplayStates[currentQuestionIndex] = [];

        shuffledOptions.forEach((opt, index) => {
            const label = ['A', 'B', 'C', 'D'][index];
            questionDisplayStates[currentQuestionIndex].push({ text: opt.text, label });
            const optionCol = document.createElement('div');
            optionCol.className = 'col-12 col-md-6';
            optionCol.innerHTML = `
                <div class="option p-3 border rounded shadow-sm h-100 d-flex align-items-center bg-body" data-is-answer="${opt.isAnswer}" data-text="${opt.text}">
                   <span class="fw-bold me-3">${label}.</span>
                   <span id="option-text-${index}"></span>
                </div>
            `;
            optionsEl.appendChild(optionCol);
            // Set text content safely to prevent HTML parsing of options too
            document.getElementById(`option-text-${index}`).textContent = opt.text;
        });
        
        optionsEl.querySelectorAll('.option').forEach(optEl => {
            optEl.addEventListener('click', () => selectOption(optEl, optEl.dataset.text));
        });

        revealAnswerBtn.disabled = false;
    }

    function selectOption(optionEl, selectedOptionText) {
        if (quizMode === 'classTime' && userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].revealed) return;
        optionsEl.querySelectorAll('.option.bg-primary').forEach(el => el.classList.remove('bg-primary', 'text-white'));
        optionEl.classList.add('bg-primary', 'text-white');
        userAnswers[currentQuestionIndex] = { selected: selectedOptionText, revealed: false };
    }
    
    function revealAnswer() {
        if (!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].revealed) return;
        applyRevealStyles(userAnswers[currentQuestionIndex].selected);
        userAnswers[currentQuestionIndex].revealed = true;
        revealAnswerBtn.disabled = true;
    }

    function applyRevealStyles() {
        optionsEl.querySelectorAll('.option').forEach(optEl => {
            optEl.classList.remove('bg-primary', 'text-white');
            if (optEl.dataset.isAnswer === 'true') {
                optEl.classList.add('correct');
            } else if (userAnswers[currentQuestionIndex] && optEl.dataset.text === userAnswers[currentQuestionIndex].selected) {
                optEl.classList.add('wrong');
            }
            optEl.style.pointerEvents = 'none';
        });
    }

    function nextQuestion() {
        if (quizMode === 'classTime' && (!userAnswers[currentQuestionIndex] || !userAnswers[currentQuestionIndex].revealed)) {
            alert("Please select an answer and reveal it before proceeding.");
            return;
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizQuestions.length) showQuestion();
        else showResults();
    }

    function showResults() {
        let correctCount = 0;
        const answerSheet = document.getElementById('answer-sheet');
        answerSheet.innerHTML = currentQuizQuestions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswerText = q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            const isCorrect = userAnswer && userAnswer.selected === correctAnswerText;
            if (isCorrect) correctCount++;
            
            const displayState = questionDisplayStates[index] || [];
            const userOpt = displayState.find(opt => userAnswer && opt.text === userAnswer.selected);
            const correctOpt = displayState.find(opt => opt.text === correctAnswerText);
            
            const userDisplay = userAnswer ? `<strong>${userOpt?.label}.</strong> ${userAnswer.selected}` : 'Not Answered';
            const correctDisplay = `<strong>${correctOpt?.label}.</strong> ${correctAnswerText}`;

            return `<div class="p-3 mb-2 rounded ${isCorrect ? 'bg-success-subtle' : 'bg-danger-subtle'}">
                        <p class="mb-1"><strong>Q${index + 1}:</strong> ${q[currentLanguage === 'english' ? 'question' : 'malayalam_question']}</p>
                        <p class="mb-1">Your Answer: ${userDisplay}</p>
                        <p class="mb-0">Correct Answer: ${correctDisplay}</p>
                    </div>`;
        }).join('');
        answerSheet.insertAdjacentHTML('afterbegin', `<h3 class="text-center mb-3">You got ${correctCount} out of ${currentQuizQuestions.length} correct!</h3>`);
        showScreen('results-container');
        quizNavigation.classList.add('d-none');
    }

    function restartQuiz() {
        questionCounter.textContent = '';
        showScreen('start-screen');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- SETTINGS & HELPERS ---
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('language', currentLanguage);
        updateLanguageSwitcherText();
        if (document.getElementById('quiz-container').offsetParent !== null) showQuestion();
    }

    function updateLanguageSwitcherText() {}
    
    function changeFontSize(amount) {
        // Set a min and max font size
        const newSize = Math.max(12, Math.min(32, currentFontSize + amount));
        currentFontSize = newSize;
        localStorage.setItem('fontSize', currentFontSize);
        applyFontSize();
    }
    
    function applyFontSize() {
        document.body.style.fontSize = `${currentFontSize}px`;
    }
});

