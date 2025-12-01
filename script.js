/* === COPY TO script.js === */

// FIX: Define this GLOBALLY so it is accessible everywhere
let QUESTIONS_DB = [];

/**
 * APP DATA & CONFIGURATION
 */
const CONFIG = {
    passMark: 70, // Percentage
    examStructure: [
        { subject: "Part I Malayalam", count: 5 },
        { subject: "Part II Malayalam", count: 5 },
        { subject: "Maths", count: 10 },
        { subject: "English", count: 5 },
        { subject: "Basic Science", count: 10 },
        { subject: "Social Science", count: 10 }
    ]
};

// Fallback data for Preview Mode only (since fetch won't work in this chat preview)
const FALLBACK_DATA = [
    {
        "question": "The length and width of a rectangular park are 9/4 metre and 8/3 metre respectively. Find the area of the park",
        "malayalam_question": "ദീർഘചതുരാകൃതിയിലുള്ള പാർക്കിൻ്റെ നീളവും വീതിയും യഥാക്രമം 9/4 മീറ്ററും 8/3 മീറ്ററുമാണ്. പാർക്കിൻ്റെ പ്രദേശം കണ്ടെത്തുക",
        "option1": "6 square metre", "malayalam_option1": "6 ചതുരശ്ര മീറ്റർ",
        "option2": "4 square metre", "malayalam_option2": "4 ചതുരശ്ര മീറ്റർ",
        "option3": "9/2 square metre", "malayalam_option3": "9/2 ചതുരശ്ര മീറ്റർ",
        "option4": "10 square metre", "malayalam_option4": "10 ചതുരശ്ര മീറ്റർ",
        "answer": "6 square metre", "malayalam_answer": "6 ചതുരശ്ര മീറ്റർ",
        "subject": "Maths", "chapter": 2, "image": "null"
    },
    {
        "question": "Who wrote the poem 'Veena Poovu'?",
        "malayalam_question": "'വീണപൂവ്' എന്ന കവിത ആരാണ് രചിച്ചത്?",
        "option1": "Kumaran Asan", "malayalam_option1": "കുമാരനാശാൻ",
        "option2": "Vallathol", "malayalam_option2": "വള്ളത്തോൾ",
        "option3": "Ulloor", "malayalam_option3": "ഉള്ളൂർ",
        "option4": "Changampuzha", "malayalam_option4": "ചങ്ങമ്പുഴ",
        "answer": "Kumaran Asan", "malayalam_answer": "കുമാരനാശാൻ",
        "subject": "Part I Malayalam", "chapter": 1, "image": "null"
    },
    {
        "question": "What is the chemical symbol for Water?",
        "malayalam_question": "വെള്ളത്തിന്റെ രാസസൂത്രം എന്താണ്?",
        "option1": "H2O", "malayalam_option1": "H2O",
        "option2": "CO2", "malayalam_option2": "CO2",
        "option3": "O2", "malayalam_option3": "O2",
        "option4": "NaCl", "malayalam_option4": "NaCl",
        "answer": "H2O", "malayalam_answer": "H2O",
        "subject": "Basic Science", "chapter": 1, "image": "null"
    },
     {
        "question": "Who was the first Prime Minister of India?",
        "malayalam_question": "ഇന്ത്യയുടെ ആദ്യത്തെ പ്രധാനമന്ത്രി ആരായിരുന്നു?",
        "option1": "Gandhi", "malayalam_option1": "ഗാന്ധി",
        "option2": "Nehru", "malayalam_option2": "നെഹ്റു",
        "option3": "Patel", "malayalam_option3": "പട്ടേൽ",
        "option4": "Ambedkar", "malayalam_option4": "അംബേദ്കർ",
        "answer": "Nehru", "malayalam_answer": "നെഹ്റു",
        "subject": "Social Science", "chapter": 1, "image": "null"
    },
    {
        "question": "Synonym of 'Happy'.",
        "malayalam_question": "'Happy' എന്ന വാക്കിന്റെ പര്യായപദം.",
        "option1": "Sad", "malayalam_option1": "Sad",
        "option2": "Joyful", "malayalam_option2": "Joyful",
        "option3": "Angry", "malayalam_option3": "Angry",
        "option4": "Tired", "malayalam_option4": "Tired",
        "answer": "Joyful", "malayalam_answer": "Joyful",
        "subject": "English", "chapter": 1, "image": "null"
    },
     {
        "question": "Identify the correct grammar usage.",
        "malayalam_question": "ശരിയായ വ്യാകരണ പ്രയോഗം തിരിച്ചറിയുക.",
        "option1": "Option A", "malayalam_option1": "ഓപ്ഷൻ എ",
        "option2": "Option B", "malayalam_option2": "ഓപ്ഷൻ ബി",
        "option3": "Option C", "malayalam_option3": "ഓപ്ഷൻ സി",
        "option4": "Option D", "malayalam_option4": "ഓപ്ഷൻ ഡി",
        "answer": "Option A", "malayalam_answer": "ഓപ്ഷൻ എ",
        "subject": "Part II Malayalam", "chapter": 1, "image": "null"
    }
];

/**
 * UTILITY FUNCTIONS
 */
const utils = {
    shuffle: (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    },
    formatTime: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

/**
 * MAIN APP LOGIC
 */
const app = {
    state: {
        currentQuestions: [],
        currentQuestionIndex: 0,
        score: 0,
        answers: [], 
        timer: 0,
        timerInterval: null,
        language: 'en', // 'en' or 'mal'
        isQuizActive: false,
        startTime: 0
    },

    init: async () => {
        app.loadStats();
        app.renderHistory();
        
        // Load questions from JSON
        await app.fetchQuestions();
    },

    fetchQuestions: async () => {
        const loading = document.getElementById('loading-indicator');
        if(loading) loading.classList.remove('d-none');
        
        try {
            // Attempt to fetch from the file
            const response = await fetch('questions.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            QUESTIONS_DB = await response.json();
            console.log("Successfully loaded questions from questions.json");
            
        } catch (error) {
            console.warn("Failed to load questions.json (This is expected in Preview mode). Using fallback data.", error);
            // Fallback for Preview or if file missing
            QUESTIONS_DB = FALLBACK_DATA; 
            
            // In a real environment, you might want to alert the user
            // alert("Could not load questions.json. Please ensure the file exists.");
        } finally {
            if(loading) loading.classList.add('d-none');
            app.populateSubjectModal(); // Refresh UI dependent on data
        }
    },

    loadStats: () => {
        const stats = JSON.parse(localStorage.getItem('quizStats')) || { total: 0, wins: 0 };
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-wins').textContent = stats.wins;
        const rate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
        document.getElementById('stat-rate').textContent = `${rate}%`;
    },

    saveStats: (isWin) => {
        const stats = JSON.parse(localStorage.getItem('quizStats')) || { total: 0, wins: 0 };
        stats.total++;
        if (isWin) stats.wins++;
        localStorage.setItem('quizStats', JSON.stringify(stats));
        
        // Save history entry
        const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        const entry = {
            date: new Date().toLocaleDateString(),
            score: app.state.score,
            total: app.state.currentQuestions.length,
            percentage: Math.round((app.state.score / app.state.currentQuestions.length) * 100)
        };
        history.unshift(entry); // Add to top
        if(history.length > 10) history.pop(); // Keep last 10
        localStorage.setItem('quizHistory', JSON.stringify(history));
    },

    showSection: (sectionId) => {
        document.querySelectorAll('#app-sections > div').forEach(div => div.classList.remove('active'));
        document.getElementById(`${sectionId}-section`).classList.add('active');
        if (sectionId === 'home') app.loadStats();
    },

    toggleLanguage: () => {
        const toggle = document.getElementById('langToggle');
        app.state.language = toggle.checked ? 'mal' : 'en';
        if (app.state.isQuizActive) {
            app.renderCurrentQuestion(false); 
        }
    },

    /**
     * QUIZ LOGIC
     */
    startFullQuiz: () => {
        if (!QUESTIONS_DB || QUESTIONS_DB.length === 0) {
            alert("Questions data not loaded. Please check questions.json.");
            return;
        }

        let finalQuestions = [];
        
        CONFIG.examStructure.forEach(req => {
            let subjectQs = QUESTIONS_DB.filter(q => q.subject === req.subject);
            
            // Handle case where we don't have enough questions for the requirement
            if (subjectQs.length === 0) {
                 // For safety in dev: mock a question if missing
                 console.warn(`No questions found for ${req.subject}`);
                 // We will skip this subject or add a dummy if needed
                 // For now, let's use what we have
            }
            
            subjectQs = utils.shuffle(subjectQs);
            
            // If we have fewer questions than requested, use them all.
            // If we have more, slice the requested amount.
            // If you absolutely need 10 but have 1, this loop fills duplicates for testing
            while(subjectQs.length > 0 && subjectQs.length < req.count) {
                subjectQs = subjectQs.concat(subjectQs);
            }
            
            finalQuestions = finalQuestions.concat(subjectQs.slice(0, req.count));
        });

        if (finalQuestions.length === 0) {
            alert("No questions found matching the exam criteria.");
            return;
        }

        app.startQuizExecution(finalQuestions);
    },

    startSubjectQuiz: (subjectName) => {
        let qs = QUESTIONS_DB.filter(q => q.subject === subjectName);
        if(qs.length === 0) {
            alert("No questions available for this subject yet.");
            return;
        }
        qs = utils.shuffle(qs);
        qs = qs.slice(0, 20); // Limit practice to 20 Qs
        
        const modalEl = document.getElementById('subjectModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();

        app.startQuizExecution(qs);
    },

    startQuizExecution: (questions) => {
        app.state.currentQuestions = questions;
        app.state.currentQuestionIndex = 0;
        app.state.score = 0;
        app.state.answers = [];
        app.state.timer = 0;
        app.state.isQuizActive = true;
        app.state.startTime = Date.now();
        
        document.getElementById('next-btn').disabled = true;
        document.getElementById('options-container').innerHTML = '';
        
        app.showSection('quiz');
        app.startTimer();
        app.renderCurrentQuestion(true);
    },

    startTimer: () => {
        if (app.state.timerInterval) clearInterval(app.state.timerInterval);
        app.state.timerInterval = setInterval(() => {
            app.state.timer++;
            document.getElementById('timer').innerHTML = `<i class="far fa-clock"></i> ${utils.formatTime(app.state.timer)}`;
        }, 1000);
    },

    renderCurrentQuestion: (isNewQuestion = false) => {
        const q = app.state.currentQuestions[app.state.currentQuestionIndex];
        const isMal = app.state.language === 'mal';
        
        // Metadata
        document.getElementById('subject-indicator').textContent = q.subject;
        document.getElementById('question-counter').textContent = 
            `Question ${app.state.currentQuestionIndex + 1} of ${app.state.currentQuestions.length}`;
        
        // Progress
        const progress = ((app.state.currentQuestionIndex) / app.state.currentQuestions.length) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;

        // Content
        document.getElementById('q-text').textContent = isMal ? q.malayalam_question : q.question;

        const imgContainer = document.getElementById('q-image-container');
        const img = document.getElementById('q-image');
        if (q.image && q.image !== "null" && q.image !== null) {
            img.src = q.image;
            imgContainer.classList.remove('d-none');
            img.onerror = function() { imgContainer.classList.add('d-none'); };
        } else {
            imgContainer.classList.add('d-none');
        }

        // Options
        const container = document.getElementById('options-container');
        
        if (isNewQuestion) {
            container.innerHTML = '';
            const options = [
                { id: 1, text: q.option1, mal: q.malayalam_option1 },
                { id: 2, text: q.option2, mal: q.malayalam_option2 },
                { id: 3, text: q.option3, mal: q.malayalam_option3 },
                { id: 4, text: q.option4, mal: q.malayalam_option4 }
            ];
            
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn option-btn';
                btn.dataset.optId = opt.id;
                btn.textContent = isMal ? opt.mal : opt.text;
                btn.onclick = () => app.handleAnswer(btn, opt, q);
                container.appendChild(btn);
            });
        } else {
            // Update text only
            const buttons = container.querySelectorAll('button');
            buttons.forEach((btn) => {
                const qKey = `option${btn.dataset.optId}`;
                const malKey = `malayalam_option${btn.dataset.optId}`;
                btn.textContent = isMal ? q[malKey] : q[qKey];
            });
        }
    },

    handleAnswer: (btn, optionObj, questionObj) => {
        const container = document.getElementById('options-container');
        const buttons = container.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);

        const correctAnswerText = questionObj.answer.trim();
        const selectedText = questionObj[`option${optionObj.id}`].trim();
        const isCorrect = selectedText === correctAnswerText;
        
        if (isCorrect) {
            btn.classList.add('correct');
            btn.innerHTML += ' <i class="fas fa-check float-end mt-1"></i>';
            app.state.score++;
        } else {
            btn.classList.add('wrong');
            btn.innerHTML += ' <i class="fas fa-times float-end mt-1"></i>';
            
            // Show correct answer
            buttons.forEach(b => {
                const optText = questionObj[`option${b.dataset.optId}`].trim();
                if (optText === correctAnswerText) {
                    b.classList.add('correct');
                    b.innerHTML += ' <i class="fas fa-check float-end mt-1"></i>';
                }
            });
        }

        app.state.answers.push({
            subject: questionObj.subject,
            isCorrect: isCorrect,
            time: Date.now()
        });

        document.getElementById('next-btn').disabled = false;
    },

    nextQuestion: () => {
        app.state.currentQuestionIndex++;
        if (app.state.currentQuestionIndex < app.state.currentQuestions.length) {
            document.getElementById('next-btn').disabled = true;
            app.renderCurrentQuestion(true);
        } else {
            app.finishQuiz();
        }
    },

    finishQuiz: () => {
        clearInterval(app.state.timerInterval);
        app.state.isQuizActive = false;

        const totalQs = app.state.currentQuestions.length;
        const percentage = Math.round((app.state.score / totalQs) * 100);
        const passed = percentage >= CONFIG.passMark;
        const timeTaken = document.getElementById('timer').textContent;

        const circle = document.getElementById('score-circle');
        circle.className = `score-circle ${passed ? 'pass' : 'fail'}`;
        circle.textContent = `${percentage}%`;

        const msgEl = document.getElementById('result-message');
        msgEl.textContent = passed ? 
            "Excellent Work!" : 
            "Don't Give Up!";
        msgEl.className = passed ? "text-success mb-2 fw-bold" : "text-danger mb-2 fw-bold";

        document.getElementById('result-time').textContent = `Total Time: ${timeTaken.trim()}`;

        // Analytics
        const subjectStats = {};
        app.state.answers.forEach(ans => {
            if (!subjectStats[ans.subject]) subjectStats[ans.subject] = { correct: 0, total: 0 };
            subjectStats[ans.subject].total++;
            if (ans.isCorrect) subjectStats[ans.subject].correct++;
        });

        const statsContainer = document.getElementById('subject-performance');
        statsContainer.innerHTML = '';
        
        let bestSub = { name: '-', val: -1 };
        let worstSub = { name: '-', val: 101 };

        Object.keys(subjectStats).forEach(sub => {
            const data = subjectStats[sub];
            const perc = Math.round((data.correct / data.total) * 100);
            
            if (perc > bestSub.val) { bestSub = { name: sub, val: perc }; }
            if (perc < worstSub.val) { worstSub = { name: sub, val: perc }; }

            statsContainer.innerHTML += `
                <div class="col-md-6">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small text-secondary text-uppercase">${sub}</span>
                        <small class="text-white">${data.correct}/${data.total}</small>
                    </div>
                    <div class="progress" style="height: 6px; background-color: #333;">
                        <div class="progress-bar ${perc >= 70 ? 'bg-success' : 'bg-warning'}" 
                             role="progressbar" style="width: ${perc}%"></div>
                    </div>
                </div>
            `;
        });

        document.getElementById('strong-subject').textContent = bestSub.name;
        document.getElementById('weak-subject').textContent = worstSub.name;

        app.saveStats(passed);
        app.showSection('result');
    },

    /**
     * HISTORY & MODALS
     */
    showHistory: () => {
        app.renderHistory();
        app.showSection('history');
    },

    renderHistory: () => {
        const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
        const container = document.getElementById('history-list');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="text-center text-secondary py-5"><i class="fas fa-history fa-2x mb-3"></i><p>No exams taken yet.</p></div>';
            return;
        }

        let html = '';
        history.forEach(h => {
            const passed = h.percentage >= CONFIG.passMark;
            html += `
                <div class="card p-3 mb-2 d-flex flex-row justify-content-between align-items-center" style="border-left: 4px solid ${passed ? 'var(--success-color)' : 'var(--error-color)'};">
                    <div>
                        <div class="fw-bold text-white">${h.date}</div>
                        <small class="text-secondary-custom">Score: ${h.score}/${h.total}</small>
                    </div>
                    <div class="fs-4 ${passed ? 'text-success' : 'text-danger'} fw-bold">
                        ${h.percentage}%
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    clearHistory: () => {
        if(confirm('Are you sure you want to clear all exam history?')) {
            localStorage.removeItem('quizHistory');
            localStorage.removeItem('quizStats');
            app.renderHistory();
            app.loadStats();
        }
    },

    showSubjectModal: () => {
        const modal = new bootstrap.Modal(document.getElementById('subjectModal'));
        modal.show();
    },

    populateSubjectModal: () => {
        // Safe check for DB
        if (!QUESTIONS_DB || QUESTIONS_DB.length === 0) return;

        const subjects = [...new Set(QUESTIONS_DB.map(q => q.subject))];
        const list = document.getElementById('subject-list');
        list.innerHTML = '';
        subjects.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action bg-transparent text-white border-secondary py-3';
            btn.innerHTML = `<i class="fas fa-book me-2 text-secondary"></i> ${sub}`;
            btn.onclick = () => app.startSubjectQuiz(sub);
            list.appendChild(btn);
        });
    }
};

document.addEventListener('DOMContentLoaded', app.init);