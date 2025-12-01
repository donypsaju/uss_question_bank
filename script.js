/* === COPY TO script.js === */

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
        answers: [], // { questionId, isCorrect, subject, timeTaken }
        timer: 0,
        timerInterval: null,
        language: 'en', // 'en' or 'mal'
        isQuizActive: false,
        startTime: 0
    },

    init: () => {
        app.loadStats();
        app.renderHistory();
        app.populateSubjectModal();
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
        let finalQuestions = [];
        
        CONFIG.examStructure.forEach(req => {
            let subjectQs = QUESTIONS_DB.filter(q => q.subject === req.subject);
            
            // Dummy Data Generator for Demo purposes if DB is empty for a subject
            if (subjectQs.length === 0) {
                 for(let i=0; i<req.count; i++) {
                     subjectQs.push({
                         ...QUESTIONS_DB[0], 
                         question: `Sample ${req.subject} Question ${i+1}`,
                         malayalam_question: `മാതൃക ${req.subject} ചോദ്യം ${i+1}`,
                         subject: req.subject
                     });
                 }
            }
            
            subjectQs = utils.shuffle(subjectQs);
            
            // Fill up to requirement (duplicate if necessary for demo)
            while(subjectQs.length < req.count) {
                subjectQs = subjectQs.concat(subjectQs);
            }
            
            finalQuestions = finalQuestions.concat(subjectQs.slice(0, req.count));
        });

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