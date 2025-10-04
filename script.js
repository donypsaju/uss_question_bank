document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & GLOBAL ELEMENTS ---
    const allMainScreens = document.querySelectorAll('main > div');
    let allQuestions = [];
    let currentLanguage = localStorage.getItem('language') || 'malayalam';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentFontSize = parseFloat(localStorage.getItem('fontSize')) || 20;
    let historyChart = null;

    const studentQuizState = {
        questions: [],
        currentIndex: 0,
        score: 0,
        timer: null,
        timeLeft: 0,
        results: {}
    };

    const teacherQuizState = {
        questions: [],
        currentIndex: 0,
        mode: '',
        currentSubject: '',
        displayStates: {},
        userAnswers: []
    };

    // --- INITIALIZATION ---
    initialize();

    async function initialize() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
            const loadingMessage = document.getElementById('loading-message');
            if (loadingMessage) loadingMessage.classList.add('d-none');
            const mainMenuButtons = document.getElementById('main-menu-buttons');
            if (mainMenuButtons) mainMenuButtons.classList.remove('visually-hidden');
        } catch (error) {
            console.error("Failed to load questions.json:", error);
            const loadingMsg = document.getElementById('loading-message');
            if (loadingMsg) {
                loadingMsg.textContent = "Error: Could not load questions. Please check the file and try again.";
                loadingMsg.classList.add('text-danger');
            }
        }

        applyTheme();
        applyFontSize();
        addEventListeners();
    }

    /**
     * Attaches all primary event listeners for the application safely.
     */
    function addEventListeners() {
        const addListenerById = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with ID "${id}" not found. Cannot attach event listener.`);
            }
        };

        // Main Menu
        addListenerById('start-student-quiz-btn', 'click', startStudentQuiz);
        addListenerById('start-teacher-quiz-btn', 'click', () => showScreen('teacher-quiz-container', 'teacher-quiz-options'));
        addListenerById('view-history-btn', 'click', showHistory);
        addListenerById('back-to-menu-btn', 'click', () => showScreen('start-screen'));


        // Student Quiz
        addListenerById('student-restart-btn', 'click', () => showScreen('start-screen'));

        // Teacher Quiz
        document.querySelectorAll('.teacher-back-to-menu').forEach(btn => btn.addEventListener('click', () => showScreen('start-screen')));
        document.querySelectorAll('.teacher-back-btn').forEach(btn => btn.addEventListener('click', (e) => showScreen('teacher-quiz-container', e.target.dataset.target)));
        addListenerById('full-quiz-btn', 'click', setupTeacherFullQuiz);
        addListenerById('subject-quiz-btn', 'click', setupTeacherSubjectQuiz);
        addListenerById('start-full-quiz-execution', 'click', startTeacherFullQuiz);
        addListenerById('start-subject-quiz-execution', 'click', startTeacherSubjectQuiz);
        addListenerById('teacher-next-btn', 'click', nextTeacherQuestion);
        addListenerById('reveal-answer-btn', 'click', revealTeacherAnswer);
        addListenerById('teacher-restart-btn', 'click', () => showScreen('teacher-quiz-container', 'teacher-quiz-options'));
        addListenerById('teacher-options', 'click', handleTeacherOptionSelection); // Event Delegation

        // Header Control Buttons
        addListenerById('theme-switcher', 'click', toggleTheme);
        addListenerById('lang-switcher', 'click', toggleLanguage);
        addListenerById('font-increase', 'click', () => changeFontSize(1));
        addListenerById('font-decrease', 'click', () => changeFontSize(-1));
    }


    // --- HELPER FUNCTIONS ---

    /**
     * Shows a specific screen and optionally a sub-screen.
     * @param {string} screenId - The ID of the main screen container to show.
     * @param {string|null} subScreenId - The ID of the sub-screen to show within the main container.
     */
    function showScreen(screenId, subScreenId = null) {
        allMainScreens.forEach(screen => screen.classList.add('d-none'));
        const mainScreen = document.getElementById(screenId);
        if (mainScreen) {
            mainScreen.classList.remove('d-none');
            if (subScreenId) {
                mainScreen.querySelectorAll(':scope > div').forEach(sub => sub.classList.add('d-none'));
                const subScreen = document.getElementById(subScreenId);
                if (subScreen) subScreen.classList.remove('d-none');
            }
        }
    }

    /**
     * Shuffles an array in place.
     * @param {Array} array - The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Renders the question image if available, otherwise hides the container.
     * @param {string|null} imageSrc - The source URL of the image.
     * @param {HTMLElement} containerEl - The container element for the image.
     * @param {HTMLImageElement} imageEl - The <img> element.
     */
    function renderQuestionImage(imageSrc, containerEl, imageEl) {
        if (imageSrc && imageSrc !== "null" && containerEl && imageEl) {
            imageEl.src = imageSrc;
            containerEl.classList.remove('d-none');
        } else if (containerEl) {
            containerEl.classList.add('d-none');
        }
    }


    // --- STUDENT QUIZ LOGIC ---

    /**
     * Sets up and starts a new quiz for the student.
     */
    function startStudentQuiz() {
        // Configuration is now centralized here for easy updates.
        const questionConfig = {
            "Part I Malayalam": 5, "Part II Malayalam": 5, "Maths": 10,
            "English": 5, "Basic Science": 10, "Social Science": 10
        };
        
        studentQuizState.questions = [];
        const availableSubjects = [...new Set(allQuestions.map(q => q.subject))];

        // Dynamically build the quiz based on the config and available questions.
        availableSubjects.forEach(subject => {
            if (questionConfig[subject]) {
                const subjectQuestions = allQuestions.filter(q => q.subject === subject);
                studentQuizState.questions.push(...shuffleArray(subjectQuestions).slice(0, questionConfig[subject]));
            }
        });

        if (studentQuizState.questions.length === 0) {
            alert("Could not generate the quiz. No questions found for the configured subjects.");
            return;
        }

        studentQuizState.currentIndex = 0;
        studentQuizState.score = 0;
        studentQuizState.results = {};
        studentQuizState.timeLeft = studentQuizState.questions.length * 60;
        
        document.getElementById('student-score-counter').textContent = `0 / ${studentQuizState.questions.length}`;
        showScreen('student-quiz-container');
        displayStudentQuestion();
        startStudentTimer();
    }

    /**
     * Displays the current student question and options.
     */
    function displayStudentQuestion() {
        if (!studentQuizState.questions[studentQuizState.currentIndex]) return;
        const q = studentQuizState.questions[studentQuizState.currentIndex];
        renderQuestionImage(q.image, document.getElementById('student-image-container'), document.getElementById('student-question-image'));

        document.getElementById('student-question-counter').textContent = `Question ${studentQuizState.currentIndex + 1} / ${studentQuizState.questions.length}`;
        document.getElementById('student-question').textContent = q[currentLanguage === 'english' ? 'question' : 'malayalam_question'];
        const optionsEl = document.getElementById('student-options');
        optionsEl.innerHTML = ''; // Clear previous options

        const optionKeys = shuffleArray(['option1', 'option2', 'option3', 'option4']);
        optionKeys.forEach(optKey => {
            const optionText = q[currentLanguage === 'english' ? optKey : `malayalam_${optKey}`];
            const isCorrect = optionText === q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'col-12 col-md-6 mb-3';
            optionDiv.innerHTML = `
                <div class="option p-3 border rounded shadow-sm h-100 d-flex align-items-center bg-body">
                    <span>${optionText}</span>
                </div>`;
            
            const optionInnerDiv = optionDiv.querySelector('.option');
            optionInnerDiv.dataset.correct = isCorrect;
            // IMPROVEMENT: Attach event listener directly instead of using onclick attribute.
            optionInnerDiv.addEventListener('click', () => selectStudentAnswer(optionInnerDiv));

            optionsEl.appendChild(optionDiv);
        });
    }

    /**
     * Handles the logic when a student selects an answer.
     * @param {HTMLElement} selectedOptionEl - The option element that was clicked.
     */
    function selectStudentAnswer(selectedOptionEl) {
        if (selectedOptionEl.classList.contains('disabled')) return;

        const isCorrect = selectedOptionEl.dataset.correct === 'true';
        const q = studentQuizState.questions[studentQuizState.currentIndex];
        
        if (!studentQuizState.results[q.subject]) {
            studentQuizState.results[q.subject] = { correct: 0, wrong: 0 };
        }

        if (isCorrect) {
            studentQuizState.score++;
            selectedOptionEl.classList.add('correct');
            studentQuizState.results[q.subject].correct++;
        } else {
            selectedOptionEl.classList.add('wrong');
            studentQuizState.results[q.subject].wrong++;
        }

        document.getElementById('student-score-counter').textContent = `${studentQuizState.score} / ${studentQuizState.questions.length}`;
        
        document.querySelectorAll('#student-options .option').forEach(opt => {
            opt.classList.add('disabled'); // Disables further clicks
            if (opt.dataset.correct === 'true' && !isCorrect) {
                opt.classList.add('correct'); // Show the correct answer if the user was wrong
            }
        });

        setTimeout(advanceToNextStudentQuestion, 2000);
    }
    
    /**
     * Moves to the next question or ends the quiz.
     */
    function advanceToNextStudentQuestion() {
        studentQuizState.currentIndex++;
        if (studentQuizState.currentIndex < studentQuizState.questions.length) {
            displayStudentQuestion();
        } else {
            endStudentQuiz();
        }
    }
    
    /**
     * Starts the timer for the student quiz.
     */
    function startStudentTimer() {
        const timerEl = document.getElementById('student-timer');
        clearInterval(studentQuizState.timer);
        studentQuizState.timer = setInterval(() => {
            studentQuizState.timeLeft--;
            const minutes = Math.floor(studentQuizState.timeLeft / 60).toString().padStart(2, '0');
            const seconds = (studentQuizState.timeLeft % 60).toString().padStart(2, '0');
            timerEl.textContent = `${minutes}:${seconds}`;
            if (studentQuizState.timeLeft <= 0) {
                endStudentQuiz();
            }
        }, 1000);
    }
    
    /**
     * Ends the student quiz, saves the result, and displays the summary.
     */
    function endStudentQuiz() {
        clearInterval(studentQuizState.timer);
        const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        const resultData = {
            date: new Date().toLocaleString(),
            score: studentQuizState.score,
            total: studentQuizState.questions.length,
            details: studentQuizState.results
        };
        history.unshift(resultData);
        localStorage.setItem('quizHistory', JSON.stringify(history.slice(0, 10)));
        
        const summaryEl = document.getElementById('student-results-summary');
        if (!summaryEl) return;
        const percentage = studentQuizState.questions.length > 0 ? (studentQuizState.score / studentQuizState.questions.length) * 100 : 0;
        let resultMessage = (percentage >= 70) 
            ? `<h3 class="text-success">Congratulations, You've Passed!</h3><p>You have achieved the score needed to pass the scholarship exam.</p>`
            : `<h3 class="text-warning">Keep Practicing!</h3><p>You're getting closer. Keep up the great work!</p>`;

        let detailsHtml = `<ul class="list-group list-group-flush">`;
        Object.entries(studentQuizState.results).forEach(([subject, data]) => {
            detailsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${subject}
                <span>
                    <span class="badge bg-success me-2">${data.correct} Correct</span>
                    <span class="badge bg-danger">${data.wrong} Wrong</span>
                </span>
            </li>`;
        });
        detailsHtml += `</ul>`;
        summaryEl.innerHTML = `
            ${resultMessage}
            <h4 class="card-title mt-4">Final Score: ${studentQuizState.score} / ${studentQuizState.questions.length}</h4>
            <hr>
            <h5 class="text-start mt-3">Subject Breakdown:</h5>
            ${detailsHtml}`;
        showScreen('student-results-container');
    }

    // --- HISTORY & ANALYTICS LOGIC ---
    function showHistory() {
        const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        const listEl = document.getElementById('history-list');
        const analyticsEl = document.getElementById('history-analytics');
        
        if (!listEl || !analyticsEl) return;

        if (history.length === 0) {
            listEl.innerHTML = `<p class="text-center">You haven't completed any quizzes yet.</p>`;
            analyticsEl.classList.add('d-none');
        } else {
            listEl.innerHTML = history.map(res => `
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">Score: ${res.score} / ${res.total} (${(res.total > 0 ? (res.score / res.total) * 100 : 0).toFixed(0)}%)</h5>
                            <small>${res.date}</small>
                        </div>
                        <small>${Object.entries(res.details).map(([sub, data]) => `${sub}: ${data.correct}C, ${data.wrong}W`).join(' | ')}</small>
                    </div>
                </div>`).join('');

            if (history.length > 1) { // Need at least 2 data points for meaningful analytics
                analyticsEl.classList.remove('d-none');
                const analytics = calculateHistoryAnalytics(history);
                renderHistoryAnalytics(analytics);
                renderHistoryChart(history);
                renderHistorySuggestions(analytics);
            } else {
                analyticsEl.classList.add('d-none');
            }
        }
        showScreen('history-container');
    }

    function calculateHistoryAnalytics(history) {
        const subjectData = {};
        let totalScores = 0, totalQuestions = 0;
        history.forEach(res => {
            totalScores += res.score;
            totalQuestions += res.total;
            Object.entries(res.details).forEach(([subject, data]) => {
                if (!subjectData[subject]) subjectData[subject] = { correct: 0, total: 0 };
                subjectData[subject].correct += data.correct;
                subjectData[subject].total += (data.correct + data.wrong);
            });
        });
        const subjectAccuracy = Object.entries(subjectData).map(([subject, data]) => ({ 
            subject, 
            accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0 
        }));
        subjectAccuracy.sort((a, b) => a.accuracy - b.accuracy); // Sort ascending to easily get weakest/strongest
        return {
            averageScore: (totalQuestions > 0 ? (totalScores / totalQuestions) * 100 : 0).toFixed(0),
            strongestSubject: subjectAccuracy[subjectAccuracy.length - 1] || { subject: 'N/A' },
            weakestSubject: subjectAccuracy[0] || { subject: 'N/A' }
        };
    }

    function renderHistoryAnalytics(analytics) {
        const avgScoreEl = document.getElementById('avg-score');
        const strongSubEl = document.getElementById('strong-subject');
        const weakSubEl = document.getElementById('weak-subject');
        if (avgScoreEl) avgScoreEl.textContent = `${analytics.averageScore}%`;
        if (strongSubEl) strongSubEl.textContent = analytics.strongestSubject.subject;
        if (weakSubEl) weakSubEl.textContent = analytics.weakestSubject.subject;
    }

    function renderHistoryChart(history) {
        if (historyChart) historyChart.destroy();
        const ctx = document.getElementById('history-chart')?.getContext('2d');
        if (!ctx) return;
        const reversedHistory = [...history].reverse();
        historyChart = new Chart(ctx, {
            type: 'line',
            data: { 
                labels: reversedHistory.map((_, i) => `Quiz ${i + 1}`), 
                datasets: [{ 
                    label: 'Score %', 
                    data: reversedHistory.map(res => res.total > 0 ? (res.score / res.total) * 100 : 0), 
                    fill: true, 
                    borderColor: 'rgb(75, 192, 192)', 
                    tension: 0.1 
                }] 
            },
            options: { scales: { y: { beginAtZero: true, max: 100 } }, responsive: true, maintainAspectRatio: false }
        });
    }

    function renderHistorySuggestions(analytics) {
        const suggestionsEl = document.getElementById('history-suggestions');
        if (!suggestionsEl) return;
        let html = `<h5 class="card-title">Suggestions for Improvement</h5><ul class="list-unstyled">`;
        if (analytics.strongestSubject.accuracy > 85) html += `<li>✅ You're excelling in <strong>${analytics.strongestSubject.subject}</strong>. Fantastic work!</li>`;
        if (analytics.weakestSubject.accuracy < 60) html += `<li>🎯 Your results suggest focusing more on <strong>${analytics.weakestSubject.subject}</strong>. Extra practice here could boost your score.</li>`;
        html += `<li>⏱️ Consistent practice is key. Try to maintain a steady pace to manage your time effectively.</li></ul>`;
        suggestionsEl.innerHTML = html;
    }

    // --- TEACHER QUIZ LOGIC ---

    function setupTeacherFullQuiz() {
        teacherQuizState.mode = 'full';
        const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => a - b);
        const chapterCheckboxesEl = document.getElementById('chapter-checkboxes');
        if (chapterCheckboxesEl) {
            chapterCheckboxesEl.innerHTML = chapters.map(ch => `
                <label class="btn btn-outline-secondary m-1">
                    <input type="checkbox" class="form-check-input" value="${ch}"> Chapter ${ch}
                </label>`).join('');
        }
        showScreen('teacher-quiz-container', 'chapter-selection');
    }

    function setupTeacherSubjectQuiz() {
        teacherQuizState.mode = 'subject';
        const subjects = [...new Set(allQuestions.map(q => q.subject))];
        const subjectButtonsEl = document.getElementById('subject-buttons');
        if (subjectButtonsEl) {
            subjectButtonsEl.innerHTML = subjects.map(sub => `<button class="btn btn-outline-primary m-2" data-subject="${sub}">${sub}</button>`).join('');
            subjectButtonsEl.onclick = (e) => {
                 if (e.target.dataset.subject) {
                     selectTeacherSubject(e.target.dataset.subject);
                 }
            };
        }
        showScreen('teacher-quiz-container', 'subject-selection');
    }
    
    function selectTeacherSubject(subject) {
        teacherQuizState.currentSubject = subject;
        const titleEl = document.getElementById('subject-chapter-title');
        if (titleEl) titleEl.textContent = `Select Chapters for ${subject}`;
        
        const chapters = [...new Set(allQuestions.filter(q => q.subject === subject).map(q => q.chapter))].sort((a, b) => a - b);
        const optionsContainer = document.getElementById('subject-chapter-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = `
                <div class="col-12 mb-3"><button class="btn btn-sm btn-secondary" id="teacher-select-all-chapters">Select/Deselect All</button></div>
                ${chapters.map(ch => `<div class="col-auto"><label class="btn btn-outline-secondary m-1"><input type="checkbox" class="form-check-input" value="${ch}"> Chapter ${ch}</label></div>`).join('')}
                <div class="col-12 mt-3"><label>Questions per chapter: <select id="teacher-question-count" class="form-select d-inline-block w-auto"><option value="5">5</option><option value="10">10</option><option value="all">All</option></select></label></div>`;
            
            const selectAllBtn = document.getElementById('teacher-select-all-chapters');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                });
            }
        }
        showScreen('teacher-quiz-container', 'subject-chapter-selection');
    }
    
    function startTeacherFullQuiz() {
        const selectedChapters = Array.from(document.querySelectorAll('#chapter-checkboxes input:checked')).map(cb => parseInt(cb.value));
        const questionCounts = { "Part I Malayalam": 5, "Part II Malayalam": 5, "Maths": 10, "English": 5, "Basic Science": 10, "Social Science": 10 };
        teacherQuizState.questions = [];
        Object.entries(questionCounts).forEach(([subject, count]) => {
            let subjectQuestions = allQuestions.filter(q => q.subject === subject && (selectedChapters.length === 0 || selectedChapters.includes(q.chapter)));
            teacherQuizState.questions.push(...shuffleArray(subjectQuestions).slice(0, count));
        });
        startTeacherQuiz();
    }
    
    function startTeacherSubjectQuiz() {
        const selectedChapters = Array.from(document.querySelectorAll('#subject-chapter-options input:checked')).map(cb => parseInt(cb.value));
        const countEl = document.getElementById('teacher-question-count');
        const count = countEl ? countEl.value : '5';
        teacherQuizState.questions = [];
        selectedChapters.forEach(chapter => {
            let chapterQuestions = allQuestions.filter(q => q.subject === teacherQuizState.currentSubject && q.chapter === chapter);
            teacherQuizState.questions.push(...shuffleArray(chapterQuestions).slice(0, count === 'all' ? undefined : parseInt(count)));
        });
        teacherQuizState.questions = shuffleArray(teacherQuizState.questions);
        startTeacherQuiz();
    }
    
    function startTeacherQuiz() {
        if (teacherQuizState.questions.length === 0) {
            alert("No questions found for the selected criteria. Please make a different selection.");
            return;
        }
        teacherQuizState.currentIndex = 0;
        teacherQuizState.userAnswers = Array(teacherQuizState.questions.length).fill(null);
        teacherQuizState.displayStates = {};
        const revealBtn = document.getElementById('reveal-answer-btn');
        if (revealBtn) revealBtn.classList.remove('d-none');
        showScreen('teacher-quiz-container', 'teacher-quiz-view');
        displayTeacherQuestion();
    }
    
    function displayTeacherQuestion() {
        if (!teacherQuizState.questions[teacherQuizState.currentIndex]) return;
        const q = teacherQuizState.questions[teacherQuizState.currentIndex];
        renderQuestionImage(q.image, document.getElementById('teacher-image-container'), document.getElementById('teacher-question-image'));

        document.getElementById('teacher-question-counter').textContent = `Question ${teacherQuizState.currentIndex + 1} / ${teacherQuizState.questions.length}`;
        document.getElementById('teacher-question').textContent = q[currentLanguage === 'english' ? 'question' : 'malayalam_question'];
        const optionsEl = document.getElementById('teacher-options');
        optionsEl.innerHTML = '';
        teacherQuizState.displayStates[teacherQuizState.currentIndex] = [];
        
        shuffleArray(['option1', 'option2', 'option3', 'option4']).forEach((optKey, index) => {
            const label = ['A', 'B', 'C', 'D'][index];
            const optionText = q[currentLanguage === 'english' ? optKey : `malayalam_${optKey}`];
            const isCorrect = optionText === q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            teacherQuizState.displayStates[teacherQuizState.currentIndex].push({ text: optionText, label });
            optionsEl.innerHTML += `
                <div class="col-12 col-md-6 mb-3">
                    <div class="option p-3 border rounded shadow-sm h-100 d-flex align-items-center bg-body" data-correct="${isCorrect}" data-text="${optionText}">
                       <span class="fw-bold me-3">${label}.</span>
                       <span>${optionText}</span>
                    </div>
                </div>`;
        });
        const revealBtn = document.getElementById('reveal-answer-btn');
        if (revealBtn) revealBtn.disabled = true;
    }

    /**
     * Handles clicks within the teacher options area using event delegation.
     * @param {Event} event - The click event object.
     */
    function handleTeacherOptionSelection(event) {
        const selectedOptionEl = event.target.closest('.option');
        if (selectedOptionEl && !selectedOptionEl.classList.contains('disabled')) {
            selectTeacherOption(selectedOptionEl);
        }
    }
    
    function selectTeacherOption(selectedOptionEl) {
        document.querySelectorAll('#teacher-options .option').forEach(opt => opt.classList.remove('bg-primary', 'text-white'));
        selectedOptionEl.classList.add('bg-primary', 'text-white');
        teacherQuizState.userAnswers[teacherQuizState.currentIndex] = selectedOptionEl.dataset.text;
        const revealBtn = document.getElementById('reveal-answer-btn');
        if (revealBtn) revealBtn.disabled = false;
    }

    function revealTeacherAnswer() {
        document.querySelectorAll('#teacher-options .option').forEach(opt => {
            opt.classList.remove('bg-primary', 'text-white');
            opt.classList.add('disabled');
            if (opt.dataset.correct === 'true') {
                opt.classList.add('correct');
            } else if (opt.dataset.text === teacherQuizState.userAnswers[teacherQuizState.currentIndex]) {
                opt.classList.add('wrong');
            }
        });
        const revealBtn = document.getElementById('reveal-answer-btn');
        if (revealBtn) revealBtn.disabled = true;
    }

    function nextTeacherQuestion() {
        teacherQuizState.currentIndex++;
        if (teacherQuizState.currentIndex < teacherQuizState.questions.length) {
            displayTeacherQuestion();
        } else {
            showTeacherResults();
        }
    }

    function showTeacherResults() {
        const sheetEl = document.getElementById('teacher-answer-sheet');
        if (!sheetEl) return;
        sheetEl.innerHTML = `<h3>Answer Key</h3>` + teacherQuizState.questions.map((q, index) => {
            const correctAnswer = q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            const displayState = teacherQuizState.displayStates[index];
            const correctLabel = displayState ? (displayState.find(opt => opt.text === correctAnswer)?.label || 'N/A') : 'N/A';
            return `<p><strong>Q${index + 1}:</strong> ${correctLabel}. ${correctAnswer}</p>`;
        }).join('');
        showScreen('teacher-quiz-container', 'teacher-results-container');
    }

    // --- GLOBAL SETTINGS FUNCTIONS ---
    function toggleTheme() {
        currentTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('theme') || 'light');
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('language', currentLanguage);
        // Refresh the current view if it's a quiz screen
        if (!document.getElementById('student-quiz-container').classList.contains('d-none')) {
            displayStudentQuestion();
        } else if (document.getElementById('teacher-quiz-view') && !document.getElementById('teacher-quiz-view').classList.contains('d-none')) {
            displayTeacherQuestion();
        }
    }

    function changeFontSize(amount) {
        currentFontSize = Math.max(12, Math.min(32, currentFontSize + amount));
        localStorage.setItem('fontSize', currentFontSize);
        applyFontSize();
    }

    function applyFontSize() {
        document.body.style.fontSize = `${currentFontSize}px`;
    }
});

