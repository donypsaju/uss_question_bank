document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const startBtn = document.getElementById('start-btn');
    const startScreen = document.getElementById('start-screen');
    const quizOptions = document.getElementById('quiz-options');
    const fullQuizBtn = document.getElementById('full-quiz-btn');
    const subjectQuizBtn = document.getElementById('subject-quiz-btn');
    const chapterSelection = document.getElementById('chapter-selection');
    const chapterCheckboxes = document.getElementById('chapter-checkboxes');
    const startFullQuizExecution = document.getElementById('start-full-quiz-execution');
    const subjectSelection = document.getElementById('subject-selection');
    const subjectButtons = document.getElementById('subject-buttons');
    const subjectChapterSelection = document.getElementById('subject-chapter-selection');
    const subjectChapterTitle = document.getElementById('subject-chapter-title');
    const subjectChapterOptions = document.getElementById('subject-chapter-options');
    const startSubjectQuizExecution = document.getElementById('start-subject-quiz-execution');
    const quizContainer = document.getElementById('quiz-container');
    const questionCounter = document.getElementById('question-counter');
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const nextBtn = document.getElementById('next-btn');
    const revealAnswerBtn = document.getElementById('reveal-answer-btn');
    const resultsContainer = document.getElementById('results-container');
    const answerSheet = document.getElementById('answer-sheet');
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
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 24;
    let quizMode = '';

    // --- INITIALIZATION ---
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
        });

    applyTheme();
    applyFontSize();
    updateLanguageSwitcherText();

    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', showQuizOptions);
    fullQuizBtn.addEventListener('click', () => {
        quizMode = 'quizTime';
        setupFullQuiz();
    });
    subjectQuizBtn.addEventListener('click', () => {
        quizMode = 'classTime';
        setupSubjectQuiz();
    });
    startFullQuizExecution.addEventListener('click', startFullQuiz);
    startSubjectQuizExecution.addEventListener('click', startSubjectQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    revealAnswerBtn.addEventListener('click', revealAnswer);
    restartBtn.addEventListener('click', restartQuiz);
    themeSwitcher.addEventListener('click', toggleTheme);
    langSwitcher.addEventListener('click', toggleLanguage);
    fontIncrease.addEventListener('click', () => changeFontSize(2));
    fontDecrease.addEventListener('click', () => changeFontSize(-2));
    questionImage.addEventListener('click', () => {
        modalImg.src = questionImage.src;
        bsImageModal.show();
    });

    // --- FUNCTIONS ---
    function showQuizOptions() {
        startScreen.classList.add('hidden');
        quizOptions.classList.remove('hidden');
    }

    function setupFullQuiz() {
        quizOptions.classList.add('hidden');
        chapterSelection.classList.remove('hidden');
        const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => a - b);
        chapterCheckboxes.innerHTML = chapters.map(ch => `
            <label class="form-check form-check-inline m-2 p-3 border rounded shadow-sm">
                <input class="form-check-input" type="checkbox" value="${ch}"> Chapter ${ch}
            </label>
        `).join('');
    }

    function setupSubjectQuiz() {
        quizOptions.classList.add('hidden');
        subjectSelection.classList.remove('hidden');
        const subjects = [...new Set(allQuestions.map(q => q.subject))];
        subjectButtons.innerHTML = subjects.map(sub => `<button class="btn btn-outline-primary m-2" data-subject="${sub}">${sub}</button>`).join('');
        subjectButtons.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => selectSubject(btn.dataset.subject));
        });
    }
    
    function selectSubject(subject) {
        subjectSelection.classList.add('hidden');
        subjectChapterSelection.classList.remove('hidden');
        subjectChapterTitle.textContent = `Select questions for ${subject}`;
        const chapters = [...new Set(allQuestions.filter(q => q.subject === subject).map(q => q.chapter))].sort((a, b) => a - b);
        subjectChapterOptions.innerHTML = chapters.map(ch => `
            <div class="col-md-4 col-sm-6 d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                <span>Chapter ${ch}:</span>
                <select class="form-select w-auto" data-chapter="${ch}" data-subject="${subject}">
                    <option value="0">0</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="all">All</option>
                </select>
            </div>
        `).join('');
    }

    function startFullQuiz() {
        chapterSelection.classList.add('hidden');
        const selectedChapters = Array.from(chapterCheckboxes.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
        const subjectOrder = ["Part I Malayalam", "Part II Malayalam", "Maths", "English", "Basic Science", "Social Science"];
        const questionCounts = {
            "Part I Malayalam": 5, "Part II Malayalam": 5, "Maths": 10,
            "English": 5, "Basic Science": 10, "Social Science": 10
        };
        currentQuizQuestions = [];
        subjectOrder.forEach(subject => {
            if (questionCounts[subject]) {
                let subjectQuestions = allQuestions.filter(q => q.subject === subject && selectedChapters.includes(q.chapter));
                if (subjectQuestions.length < questionCounts[subject]) {
                    subjectQuestions = allQuestions.filter(q => q.subject === subject);
                }
                const selectedQuestions = shuffleArray(subjectQuestions).slice(0, questionCounts[subject]);
                currentQuizQuestions.push(...selectedQuestions);
            }
        });
        startQuiz();
    }
    
    function startSubjectQuiz() {
        subjectChapterSelection.classList.add('hidden');
        currentQuizQuestions = [];
        subjectChapterOptions.querySelectorAll('select').forEach(select => {
            const subject = select.dataset.subject;
            const chapter = parseInt(select.dataset.chapter);
            const count = select.value;
            if (count !== "0") {
                let chapterQuestions = allQuestions.filter(q => q.subject === subject && q.chapter === chapter);
                if (count === 'all') {
                    currentQuizQuestions.push(...chapterQuestions);
                } else {
                    currentQuizQuestions.push(...shuffleArray(chapterQuestions).slice(0, parseInt(count)));
                }
            }
        });
        currentQuizQuestions = shuffleArray(currentQuizQuestions);
        startQuiz();
    }

    function startQuiz() {
        quizContainer.classList.remove('hidden');
        currentQuestionIndex = 0;
        userAnswers = Array(currentQuizQuestions.length).fill(null);
        questionDisplayStates = {};
        if (quizMode === 'classTime') {
            revealAnswerBtn.classList.remove('hidden');
            nextBtn.textContent = "Next Question";
        } else {
            revealAnswerBtn.classList.add('hidden');
            nextBtn.textContent = "Next";
        }
        showQuestion();
    }

    function showQuestion() {
        questionCounter.textContent = `Question ${currentQuestionIndex + 1} / ${currentQuizQuestions.length}`;
        const question = currentQuizQuestions[currentQuestionIndex];
        const questionTextKey = currentLanguage === 'english' ? 'question' : 'malayalam_question';
        questionEl.innerHTML = `<strong>Q${currentQuestionIndex + 1}:</strong> ${question[questionTextKey]}`;

        if (question.image && question.image !== "null") {
            questionImageContainer.classList.remove('hidden');
            questionImage.src = question.image;
        } else {
            questionImageContainer.classList.add('hidden');
            questionImage.src = '';
        }

        const optionKeys = ['option1', 'option2', 'option3', 'option4'];
        const malayalamOptionKeys = ['malayalam_option1', 'malayalam_option2', 'malayalam_option3', 'malayalam_option4'];
        let optionsToDisplay = [];
        if (currentLanguage === 'english') {
            optionsToDisplay = optionKeys.map(key => ({ text: question[key], isAnswer: question[key] === question['answer'] }));
        } else {
            optionsToDisplay = malayalamOptionKeys.map(key => ({ text: question[key], isAnswer: question[key] === question['malayalam_answer'] }));
        }

        optionsEl.innerHTML = '';
        const optionLabels = ['A', 'B', 'C', 'D'];
        const shuffledOptions = shuffleArray(optionsToDisplay);
        questionDisplayStates[currentQuestionIndex] = [];

        shuffledOptions.forEach((opt, index) => {
            const label = optionLabels[index];
            questionDisplayStates[currentQuestionIndex].push({ text: opt.text, label: label });

            const optionCol = document.createElement('div');
            optionCol.classList.add('col-md-6');
            const optionEl = document.createElement('div');
            optionEl.classList.add('option', 'p-3', 'border', 'rounded', 'shadow-sm', 'h-100', 'd-flex', 'align-items-center');
            optionEl.textContent = `${label}. ${opt.text}`;
            optionEl.dataset.isAnswer = opt.isAnswer;
            optionEl.addEventListener('click', () => selectOption(optionEl, opt.text));
            
            if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].selected === opt.text) {
                optionEl.classList.add('selected');
            }
            optionCol.appendChild(optionEl);
            optionsEl.appendChild(optionCol);
        });

        nextBtn.disabled = false;
        if (quizMode === 'classTime') {
            revealAnswerBtn.disabled = false;
            revealAnswerBtn.classList.remove('hidden');
        } else {
            revealAnswerBtn.classList.add('hidden');
        }

        if (quizMode === 'classTime' && userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].revealed) {
             applyRevealStyles(userAnswers[currentQuestionIndex].selected);
             revealAnswerBtn.disabled = true;
        }
    }

    function selectOption(optionEl, selectedOptionText) {
        if (quizMode === 'classTime' && userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].revealed) {
            return;
        }
        const alreadySelected = optionsEl.querySelector('.option.selected');
        if (alreadySelected) {
            alreadySelected.classList.remove('selected');
        }
        optionEl.classList.add('selected');
        userAnswers[currentQuestionIndex] = { selected: selectedOptionText, revealed: false };
    }
    
    function revealAnswer() {
        if (!userAnswers[currentQuestionIndex] || userAnswers[currentQuestionIndex].revealed) {
            return;
        }
        const selectedOptionText = userAnswers[currentQuestionIndex].selected;
        applyRevealStyles(selectedOptionText);
        userAnswers[currentQuestionIndex].revealed = true;
        revealAnswerBtn.disabled = true;
    }

    function applyRevealStyles(selectedOptionText) {
        const correctAnswerText = currentQuizQuestions[currentQuestionIndex][currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
        Array.from(optionsEl.children).forEach(optionCol => {
            const optEl = optionCol.querySelector('.option');
            // Check based on original text, ignoring the 'A. ' prefix
            const originalText = optEl.textContent.substring(optEl.textContent.indexOf(' ') + 1);
            
            if (originalText === correctAnswerText) {
                optEl.classList.add('correct');
            } else if (originalText === selectedOptionText) {
                optEl.classList.add('wrong');
            }
            optEl.style.pointerEvents = 'none';
        });
    }

    function nextQuestion() {
        if (quizMode === 'classTime' && (!userAnswers[currentQuestionIndex] || !userAnswers[currentQuestionIndex].revealed)) {
            alert("Please reveal the answer before proceeding.");
            return;
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizQuestions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }

    function showResults() {
        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        let correctCount = 0;
        answerSheet.innerHTML = currentQuizQuestions.map((q, index) => {
            const userAnswerObj = userAnswers[index];
            const userAnswerText = userAnswerObj ? userAnswerObj.selected : null;
            const correctAnswerKey = currentLanguage === 'english' ? 'answer' : 'malayalam_answer';
            const correctAnswerText = q[correctAnswerKey];
            const questionTextKey = currentLanguage === 'english' ? 'question' : 'malayalam_question';
            const isCorrect = userAnswerText === correctAnswerText;
            if (isCorrect) correctCount++;

            const displayState = questionDisplayStates[index] || [];
            const userOption = displayState.find(opt => opt.text === userAnswerText);
            const correctOption = displayState.find(opt => opt.text === correctAnswerText);
            const userLabel = userOption ? `<strong>${userOption.label}.</strong>` : '';
            const correctLabel = correctOption ? `<strong>${correctOption.label}.</strong>` : '';
            const userAnswerDisplay = userAnswerText ? `${userLabel} ${userAnswerText}` : 'Not Answered';
            const correctAnswerDisplay = `${correctLabel} ${correctAnswerText}`;

            return `
                <div class="result-item p-3 mb-2 rounded shadow-sm ${isCorrect ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}">
                    <p class="mb-1"><strong>Question ${index + 1}:</strong> ${q[questionTextKey]}</p>
                    <p class="mb-1">Your Answer: ${userAnswerDisplay}</p>
                    <p class="mb-0">Correct Answer: ${correctAnswerDisplay}</p>
                </div>
            `;
        }).join('');
        answerSheet.insertAdjacentHTML('afterbegin', `<h3 class="text-center mb-3">You got ${correctCount} out of ${currentQuizQuestions.length} correct!</h3>`);
    }

    function restartQuiz() {
        resultsContainer.classList.add('hidden');
        startScreen.classList.remove('hidden');
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
        document.body.className = `${currentTheme}-theme`;
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('language', currentLanguage);
        updateLanguageSwitcherText();
        if (!quizContainer.classList.contains('hidden')) {
            showQuestion();
        }
    }

    function updateLanguageSwitcherText() {
        // This can be enhanced to show the current language or the one to switch to.
    }
    
    function changeFontSize(amount) {
        currentFontSize = Math.max(16, currentFontSize + amount);
        localStorage.setItem('fontSize', currentFontSize);
        applyFontSize();
    }

    function applyFontSize() {
        document.body.style.fontSize = `${currentFontSize}px`;
    }
});
