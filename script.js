document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL ELEMENTS & STATE ---
    const allMainScreens = document.querySelectorAll('main > div');
    let allQuestions = [];
    let currentLanguage = localStorage.getItem('language') || 'malayalam';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentFontSize = parseFloat(localStorage.getItem('fontSize')) || 20;
    let historyChart = null; // Chart instance variable

    // --- INITIALIZATION ---
    fetch('questions.json').then(res => res.json()).then(data => {
        allQuestions = data;
    });
    applyTheme();
    applyFontSize();

    // --- EVENT LISTENERS (Main Menu & Global) ---
    document.getElementById('start-student-quiz-btn').addEventListener('click', startStudentQuiz);
    document.getElementById('start-teacher-quiz-btn').addEventListener('click', () => showScreen('teacher-quiz-container', 'teacher-quiz-options'));
    document.getElementById('view-history-btn').addEventListener('click', showHistory);
    document.getElementById('back-to-menu-btn').addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('theme-switcher').addEventListener('click', toggleTheme);
    document.getElementById('lang-switcher').addEventListener('click', toggleLanguage);
    document.getElementById('font-increase').addEventListener('click', () => changeFontSize(2));
    document.getElementById('font-decrease').addEventListener('click', () => changeFontSize(-2));

    // --- HELPER FUNCTIONS ---
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

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- STUDENT QUIZ LOGIC ---
    const studentQuizState = {
        questions: [],
        currentIndex: 0,
        score: 0,
        timer: null,
        timeLeft: 0,
        results: {}
    };

    function startStudentQuiz() {
        const subjectOrder = ["Part I Malayalam", "Part II Malayalam", "Maths", "English", "Basic Science", "Social Science"];
        const questionConfig = { "Part I Malayalam": 5, "Part II Malayalam": 5, "Maths": 10, "English": 5, "Basic Science": 10, "Social Science": 10 };
        studentQuizState.questions = [];
        subjectOrder.forEach(subject => {
            if (questionConfig[subject]) {
                const subjectQuestions = allQuestions.filter(q => q.subject === subject);
                studentQuizState.questions.push(...shuffleArray(subjectQuestions).slice(0, questionConfig[subject]));
            }
        });
        
        studentQuizState.currentIndex = 0;
        studentQuizState.score = 0;
        studentQuizState.results = {};
        studentQuizState.timeLeft = studentQuizState.questions.length * 60;
        document.getElementById('student-score-counter').textContent = `0 / ${studentQuizState.questions.length}`;
        showScreen('student-quiz-container');
        displayStudentQuestion();
        startStudentTimer();
    }

    function displayStudentQuestion() {
        const q = studentQuizState.questions[studentQuizState.currentIndex];
        document.getElementById('student-question-counter').textContent = `Question ${studentQuizState.currentIndex + 1} / ${studentQuizState.questions.length}`;
        document.getElementById('student-question').textContent = q[currentLanguage === 'english' ? 'question' : 'malayalam_question'];
        const optionsEl = document.getElementById('student-options');
        optionsEl.innerHTML = '';
        shuffleArray(['option1', 'option2', 'option3', 'option4']).forEach(optKey => {
            const optionText = q[currentLanguage === 'english' ? optKey : `malayalam_${optKey}`];
            const isCorrect = optionText === q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            optionsEl.innerHTML += `
                <div class="col-12 col-md-6">
                    <div class="option p-3 border rounded shadow-sm h-100 d-flex align-items-center bg-body" data-correct="${isCorrect}" onclick="selectStudentAnswer(this)">
                        <span>${optionText}</span>
                    </div>
                </div>`;
        });
    }

    window.selectStudentAnswer = function(selectedOptionEl) {
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
            opt.classList.add('disabled');
            if (opt.dataset.correct === 'true' && !isCorrect) {
                opt.classList.add('correct');
            }
        });
        setTimeout(advanceToNextStudentQuestion, 2000);
    }

    function advanceToNextStudentQuestion() {
        studentQuizState.currentIndex++;
        if (studentQuizState.currentIndex < studentQuizState.questions.length) {
            displayStudentQuestion();
        } else {
            endStudentQuiz();
        }
    }

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
        const percentage = (studentQuizState.score / studentQuizState.questions.length) * 100;
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

    document.getElementById('student-restart-btn').addEventListener('click', () => showScreen('start-screen'));

    // --- HISTORY & ANALYTICS LOGIC ---
    function showHistory() {
        const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        const listEl = document.getElementById('history-list');
        const analyticsEl = document.getElementById('history-analytics');

        if (history.length === 0) {
            listEl.innerHTML = `<p class="text-center">You haven't completed any quizzes yet.</p>`;
            analyticsEl.classList.add('d-none');
        } else {
            // Display individual quiz cards
            listEl.innerHTML = history.map(res => `
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex w-100 justify-content-between">
                            <h5 class="mb-1">Score: ${res.score} / ${res.total} (${((res.score / res.total) * 100).toFixed(0)}%)</h5>
                            <small>${res.date}</small>
                        </div>
                        <small>${Object.entries(res.details).map(([sub, data]) => `${sub}: ${data.correct}C, ${data.wrong}W`).join(' | ')}</small>
                    </div>
                </div>`).join('');

            // If more than 2 quizzes, show analytics
            if (history.length > 2) {
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
        let totalScores = 0;
        let totalQuestions = 0;

        history.forEach(res => {
            totalScores += res.score;
            totalQuestions += res.total;
            Object.entries(res.details).forEach(([subject, data]) => {
                if (!subjectData[subject]) {
                    subjectData[subject] = { correct: 0, total: 0 };
                }
                subjectData[subject].correct += data.correct;
                subjectData[subject].total += (data.correct + data.wrong);
            });
        });

        const subjectAccuracy = Object.entries(subjectData).map(([subject, data]) => ({
            subject,
            accuracy: (data.correct / data.total) * 100
        }));

        subjectAccuracy.sort((a, b) => b.accuracy - a.accuracy);

        return {
            averageScore: ((totalScores / totalQuestions) * 100).toFixed(0),
            strongestSubject: subjectAccuracy.length > 0 ? subjectAccuracy[0] : { subject: 'N/A', accuracy: 0 },
            weakestSubject: subjectAccuracy.length > 0 ? subjectAccuracy[subjectAccuracy.length - 1] : { subject: 'N/A', accuracy: 0 }
        };
    }

    function renderHistoryAnalytics(analytics) {
        document.getElementById('avg-score').textContent = `${analytics.averageScore}%`;
        document.getElementById('strong-subject').textContent = analytics.strongestSubject.subject;
        document.getElementById('weak-subject').textContent = analytics.weakestSubject.subject;
    }

    function renderHistoryChart(history) {
        if (historyChart) {
            historyChart.destroy();
        }
        const ctx = document.getElementById('history-chart').getContext('2d');
        const reversedHistory = [...history].reverse(); // Oldest to newest
        
        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: reversedHistory.map((_, index) => `Quiz ${index + 1}`),
                datasets: [{
                    label: 'Score %',
                    data: reversedHistory.map(res => (res.score / res.total) * 100),
                    fill: true,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    function renderHistorySuggestions(analytics) {
        const suggestionsEl = document.getElementById('history-suggestions');
        let suggestionsHTML = `<h5 class="card-title">Suggestions for Improvement</h5>`;
        suggestionsHTML += `<ul class="list-unstyled">`;
        
        if (analytics.strongestSubject && analytics.strongestSubject.accuracy > 85) {
            suggestionsHTML += `<li>✅ You're excelling in <strong>${analytics.strongestSubject.subject}</strong>. Fantastic work, keep reinforcing that knowledge!</li>`;
        }
        if (analytics.weakestSubject && analytics.weakestSubject.accuracy < 60) {
            suggestionsHTML += `<li>🎯 Your results suggest focusing more on <strong>${analytics.weakestSubject.subject}</strong>. Reviewing notes or doing extra practice in this area could boost your overall score significantly.</li>`;
        }
        suggestionsHTML += `<li>⏱️ Remember, consistent practice is key. Try to maintain a steady pace during the quiz to manage your time effectively across all subjects.</li>`;
        suggestionsHTML += `</ul>`;
        
        suggestionsEl.innerHTML = suggestionsHTML;
    }

    // --- TEACHER QUIZ LOGIC ---
    const teacherQuizState = {
        questions: [],
        currentIndex: 0,
        mode: '',
        displayStates: {},
        userAnswers: []
    };

    document.getElementById('full-quiz-btn').addEventListener('click', setupTeacherFullQuiz);
    document.getElementById('subject-quiz-btn').addEventListener('click', setupTeacherSubjectQuiz);
    document.getElementById('start-full-quiz-execution').addEventListener('click', startTeacherFullQuiz);
    document.getElementById('start-subject-quiz-execution').addEventListener('click', startTeacherSubjectQuiz);
    document.getElementById('teacher-next-btn').addEventListener('click', nextTeacherQuestion);
    document.getElementById('reveal-answer-btn').addEventListener('click', revealTeacherAnswer);
    document.getElementById('teacher-restart-btn').addEventListener('click', () => showScreen('start-screen'));

    function setupTeacherFullQuiz() {
        teacherQuizState.mode = 'full';
        const chapters = [...new Set(allQuestions.map(q => q.chapter))].sort((a, b) => a - b);
        document.getElementById('chapter-checkboxes').innerHTML = chapters.map(ch => `
            <label class="btn btn-outline-secondary">
                <input type="checkbox" class="form-check-input" value="${ch}"> Chapter ${ch}
            </label>`).join('');
        showScreen('teacher-quiz-container', 'chapter-selection');
    }

    function setupTeacherSubjectQuiz() {
        teacherQuizState.mode = 'subject';
        const subjects = [...new Set(allQuestions.map(q => q.subject))];
        document.getElementById('subject-buttons').innerHTML = subjects.map(sub => `<button class="btn btn-outline-primary m-2" data-subject="${sub}">${sub}</button>`).join('');
        document.querySelectorAll('#subject-buttons button').forEach(btn => {
            btn.addEventListener('click', (e) => selectTeacherSubject(e.target.dataset.subject));
        });
        showScreen('teacher-quiz-container', 'subject-selection');
    }

    function selectTeacherSubject(subject) {
        document.getElementById('subject-chapter-title').textContent = `Select Chapters for ${subject}`;
        const chapters = [...new Set(allQuestions.filter(q => q.subject === subject).map(q => q.chapter))].sort((a, b) => a - b);
        const optionsContainer = document.getElementById('subject-chapter-options');
        optionsContainer.innerHTML = `
            <div class="col-12 mb-3">
                <button class="btn btn-sm btn-secondary" id="teacher-select-all-chapters">Select/Deselect All</button>
            </div>
            ${chapters.map(ch => `
                <div class="col-auto">
                    <label class="btn btn-outline-secondary">
                        <input type="checkbox" class="form-check-input" value="${ch}"> Chapter ${ch}
                    </label>
                </div>`).join('')}
            <div class="col-12 mt-3">
                <label>Questions per chapter: 
                    <select id="teacher-question-count" class="form-select d-inline-block w-auto">
                        <option value="5">5</option><option value="10">10</option><option value="all">All</option>
                    </select>
                </label>
            </div>`;
        document.getElementById('teacher-select-all-chapters').addEventListener('click', () => {
            const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
        });
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
        teacherQuizState.questions = [];
        const selectedChapters = Array.from(document.querySelectorAll('#subject-chapter-options input:checked')).map(cb => parseInt(cb.value));
        const count = document.getElementById('teacher-question-count').value;
        const subject = document.getElementById('subject-chapter-title').textContent.replace('Select Chapters for ', '');
        selectedChapters.forEach(chapter => {
            let chapterQuestions = allQuestions.filter(q => q.subject === subject && q.chapter === chapter);
            teacherQuizState.questions.push(...shuffleArray(chapterQuestions).slice(0, count === 'all' ? undefined : parseInt(count)));
        });
        teacherQuizState.questions = shuffleArray(teacherQuizState.questions);
        startTeacherQuiz();
    }

    function startTeacherQuiz() {
        teacherQuizState.currentIndex = 0;
        teacherQuizState.userAnswers = Array(teacherQuizState.questions.length).fill(null);
        teacherQuizState.displayStates = {};
        document.getElementById('reveal-answer-btn').classList.remove('d-none');
        showScreen('teacher-quiz-container', 'teacher-quiz-view');
        displayTeacherQuestion();
    }

    function displayTeacherQuestion() {
        const q = teacherQuizState.questions[teacherQuizState.currentIndex];
        document.getElementById('teacher-question-counter').textContent = `Question ${teacherQuizState.currentIndex + 1} / ${teacherQuizState.questions.length}`;
        document.getElementById('teacher-question').textContent = q[currentLanguage === 'english' ? 'question' : 'malayalam_question'];
        const optionsEl = document.getElementById('teacher-options');
        optionsEl.innerHTML = '';
        shuffleArray(['option1', 'option2', 'option3', 'option4']).forEach((optKey, index) => {
            const label = ['A', 'B', 'C', 'D'][index];
            const optionText = q[currentLanguage === 'english' ? optKey : `malayalam_${optKey}`];
            const isCorrect = optionText === q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            teacherQuizState.displayStates[teacherQuizState.currentIndex].push({ text: optionText, label });
            optionsEl.innerHTML += `
                <div class="col-12 col-md-6">
                    <div class="option p-3 border rounded shadow-sm h-100 d-flex align-items-center bg-body" data-correct="${isCorrect}" data-text="${optionText}">
                       <span class="fw-bold me-3">${label}.</span>
                       <span>${optionText}</span>
                    </div>
                </div>`;
        });
        optionsEl.querySelectorAll('.option').forEach(opt => opt.addEventListener('click', (e) => selectTeacherOption(e.currentTarget)));
        document.getElementById('reveal-answer-btn').disabled = true;
    }

    function selectTeacherOption(selectedOptionEl) {
        document.querySelectorAll('#teacher-options .option').forEach(opt => opt.classList.remove('bg-primary', 'text-white'));
        selectedOptionEl.classList.add('bg-primary', 'text-white');
        teacherQuizState.userAnswers[teacherQuizState.currentIndex] = selectedOptionEl.dataset.text;
        document.getElementById('reveal-answer-btn').disabled = false;
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
        document.getElementById('reveal-answer-btn').disabled = true;
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
        sheetEl.innerHTML = `<h3>Answer Key</h3>` + teacherQuizState.questions.map((q, index) => {
            const correctAnswer = q[currentLanguage === 'english' ? 'answer' : 'malayalam_answer'];
            const displayState = teacherQuizState.displayStates[index];
            const correctLabel = displayState.find(opt => opt.text === correctAnswer)?.label;
            return `<p><strong>Q${index + 1}:</strong> ${correctLabel}. ${correctAnswer}</p>`;
        }).join('');
        showScreen('teacher-quiz-container', 'teacher-results-container');
    }

    // --- GLOBAL SETTINGS FUNCTIONS ---
    function toggleTheme() {
        currentTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
    }

    function applyTheme() {
        document.documentElement.setAttribute('data-bs-theme', localStorage.getItem('theme') || 'light');
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'english' ? 'malayalam' : 'english';
        localStorage.setItem('language', currentLanguage);
        if (!document.getElementById('student-quiz-container').classList.contains('d-none')) {
            displayStudentQuestion();
        } else if (document.getElementById('teacher-quiz-view') && !document.getElementById('teacher-quiz-view').classList.contains('d-none')) {
            displayTeacherQuestion();
        }
    }

    function changeFontSize(amount) {
        const newSize = Math.max(12, Math.min(32, currentFontSize + amount));
        currentFontSize = newSize;
        localStorage.setItem('fontSize', currentFontSize);
        applyFontSize();
    }

    function applyFontSize() {
        document.body.style.fontSize = `${currentFontSize}px`;
    }
});

