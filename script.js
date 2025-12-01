// Global State
let allQuestions = [];
let currentQuizQueue = [];
let currentQuestionIndex = 0;
let userAnswers = []; // { subject, isCorrect, timeTaken }
let quizStartTime;
let questionStartTime;
let timerInterval;

// Full Exam Config
const EXAM_CONFIG = [
    { subject: "Part I Malayalam", count: 5 },
    { subject: "Part II Malayalam", count: 5 },
    { subject: "Maths", count: 10 },
    { subject: "English", count: 5 },
    { subject: "Basic Science", count: 10 },
    { subject: "Social Science", count: 10 }
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Initialized"); // Debug check
    loadQuestions();
    updateHomeStats();
    
    // Language Toggle Listener
    const langToggle = document.getElementById('langToggle');
    if(langToggle) {
        langToggle.addEventListener('change', () => {
            if(currentQuizQueue.length > 0) renderQuestion();
        });
    }
});

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestions = await response.json();
        console.log("Questions loaded:", allQuestions.length);
    } catch (error) {
        alert("Error loading questions.json. Check console for details.");
        console.error("JSON Load Error:", error);
    }
}

// --- Navigation ---
function hideAllViews() {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
}

function showHome() {
    clearInterval(timerInterval);
    hideAllViews();
    updateHomeStats();
    const homeView = document.getElementById('home-view');
    if(homeView) {
        homeView.classList.remove('d-none');
        homeView.classList.add('active');
    }
}

// --- Quiz Setup ---
// Make this function global so HTML onclick works
window.setupQuiz = function(mode, param) {
    console.log("Setup Quiz Triggered:", mode);
    currentQuizQueue = [];
    
    if (allQuestions.length === 0) {
        alert("No questions loaded yet. Please wait or check questions.json");
        return;
    }

    if (mode === 'full') {
        EXAM_CONFIG.forEach(config => {
            const subjectQuestions = allQuestions.filter(q => q.subject === config.subject);
            const shuffled = shuffleArray([...subjectQuestions]).slice(0, config.count);
            currentQuizQueue = currentQuizQueue.concat(shuffled);
        });
    } else if (mode === 'subject') {
        currentQuizQueue = shuffleArray(allQuestions.filter(q => q.subject === param));
    } else if (mode === 'chapter') {
        const [subj, chap] = param.split('|');
        currentQuizQueue = shuffleArray(allQuestions.filter(q => q.subject === subj && String(q.chapter) === chap));
    }

    if (currentQuizQueue.length === 0) {
        // Fallback: If no strict subject match, just load "Maths" or whatever is in JSON for testing
        console.warn("No exact matches found. Loading ALL questions for testing.");
        currentQuizQueue = shuffleArray([...allQuestions]);
    }

    startQuiz();
}

function startQuiz() {
    hideAllViews();
    document.getElementById('quiz-view').classList.remove('d-none');
    
    currentQuestionIndex = 0;
    userAnswers = [];
    quizStartTime = new Date();
    
    // Start Timer
    const timerDisplay = document.getElementById('timer');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - quizStartTime) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        if(timerDisplay) timerDisplay.innerText = `${min}:${sec}`;
    }, 1000);

    renderQuestion();
}

// --- Selection Logic ---
window.showSelection = function(type) {
    hideAllViews();
    document.getElementById('selection-view').classList.remove('d-none');
    const container = document.getElementById('selection-container');
    container.innerHTML = '';
    
    if (type === 'subject') {
        document.getElementById('selection-title').innerText = "Select Subject";
        const subjects = [...new Set(allQuestions.map(q => q.subject))];
        subjects.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action';
            btn.innerText = sub;
            btn.onclick = () => setupQuiz('subject', sub);
            container.appendChild(btn);
        });
    } else {
        document.getElementById('selection-title').innerText = "Select Chapter";
        const map = new Set();
        allQuestions.forEach(q => map.add(`${q.subject}|${q.chapter}`));
        
        map.forEach(item => {
            const [subj, chap] = item.split('|');
            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action';
            btn.innerText = `${subj} - Chapter ${chap}`;
            btn.onclick = () => setupQuiz('chapter', item);
            container.appendChild(btn);
        });
    }
}

// --- Core Quiz Logic ---
window.nextQuestion = function() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuizQueue.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function renderQuestion() {
    questionStartTime = new Date();
    const q = currentQuizQueue[currentQuestionIndex];
    const isMal = document.getElementById('langToggle').checked;
    
    document.getElementById('q-current').innerText = currentQuestionIndex + 1;
    document.getElementById('q-total').innerText = currentQuizQueue.length;
    document.getElementById('q-subject').innerText = q.subject;
    
    const progress = ((currentQuestionIndex) / currentQuizQueue.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    document.getElementById('q-text').innerText = (isMal && q.malayalam_question) ? q.malayalam_question : q.question;

    const imgContainer = document.getElementById('q-image-container');
    const imgTag = document.getElementById('q-image');
    if (q.image && q.image !== "null" && q.image.trim() !== "") {
        imgTag.src = q.image;
        imgContainer.classList.remove('d-none');
    } else {
        imgContainer.classList.add('d-none');
    }

    document.getElementById('feedback-area').classList.add('d-none');
    document.getElementById('btn-next').classList.add('d-none');

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    [1, 2, 3, 4].forEach(i => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-option';
        const optText = (isMal && q[`malayalam_option${i}`]) ? q[`malayalam_option${i}`] : q[`option${i}`];
        btn.innerText = optText;
        btn.onclick = () => checkAnswer(btn, optText, q);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedBtn, selectedText, questionObj) {
    const allBtns = document.querySelectorAll('.btn-option');
    allBtns.forEach(b => b.disabled = true);

    const isMal = document.getElementById('langToggle').checked;
    // Safety check: if mal_answer is missing, fallback to english answer logic
    const correctText = (isMal && questionObj.malayalam_answer) ? questionObj.malayalam_answer : questionObj.answer;
    
    // Strict string comparison (trim spaces)
    const isCorrect = (selectedText.trim() === correctText.trim());
    
    const timeTaken = (new Date() - questionStartTime) / 1000;
    userAnswers.push({
        subject: questionObj.subject,
        isCorrect: isCorrect,
        time: timeTaken
    });

    if (isCorrect) {
        selectedBtn.classList.add('correct');
        showFeedback(true, "Correct Answer!");
    } else {
        selectedBtn.classList.add('wrong');
        allBtns.forEach(btn => {
            if (btn.innerText.trim() === correctText.trim()) {
                btn.classList.add('correct');
            }
        });
        showFeedback(false, `Wrong! Correct: ${correctText}`);
    }

    document.getElementById('btn-next').classList.remove('d-none');
}

function showFeedback(isSuccess, msg) {
    const el = document.getElementById('feedback-area');
    el.className = `alert mt-3 text-center ${isSuccess ? 'alert-success' : 'alert-danger'}`;
    el.innerText = msg;
    el.classList.remove('d-none');
}

function finishQuiz() {
    clearInterval(timerInterval);
    hideAllViews();
    document.getElementById('result-view').classList.remove('d-none');

    const totalQ = userAnswers.length;
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQ) * 100) || 0;
    const isPass = percentage >= 70;

    const resCircle = document.querySelector('.result-circle');
    const resTitle = document.getElementById('result-title');
    document.getElementById('result-score').innerText = `${percentage}%`;
    
    resCircle.classList.remove('result-pass', 'result-fail');
    resCircle.classList.add(isPass ? 'result-pass' : 'result-fail');
    resTitle.innerText = isPass ? "Congratulations! 🎉" : "Try Again! 📚";
    resTitle.className = isPass ? "display-4 mb-3 text-success" : "display-4 mb-3 text-danger";

    const subjectStats = {};
    let totalTime = 0;

    userAnswers.forEach(ans => {
        if (!subjectStats[ans.subject]) subjectStats[ans.subject] = { correct: 0, wrong: 0, total: 0 };
        subjectStats[ans.subject].total++;
        if (ans.isCorrect) subjectStats[ans.subject].correct++;
        else subjectStats[ans.subject].wrong++;
        totalTime += ans.time;
    });

    const tbody = document.getElementById('res-table-body');
    tbody.innerHTML = '';
    
    let strongestSub = { name: 'N/A', rate: -1 };
    let weakestSub = { name: 'N/A', rate: 101 };

    for (const [subj, stats] of Object.entries(subjectStats)) {
        const row = `<tr>
            <td>${subj}</td>
            <td class="text-success">${stats.correct}</td>
            <td class="text-danger">${stats.wrong}</td>
        </tr>`;
        tbody.innerHTML += row;

        const rate = (stats.correct / stats.total) * 100;
        if (rate > strongestSub.rate) strongestSub = { name: subj, rate: rate };
        if (rate < weakestSub.rate) weakestSub = { name: subj, rate: rate };
    }

    document.getElementById('res-time').innerText = (totalTime / totalQ).toFixed(1) + "s";
    document.getElementById('res-strong').innerText = strongestSub.name;
    document.getElementById('res-weak').innerText = weakestSub.name;

    saveHistory(percentage, isPass);
}

function saveHistory(score, isPass) {
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const record = {
        date: new Date().toLocaleDateString(),
        score: score,
        result: isPass ? 'Win' : 'Fail'
    };
    history.unshift(record);
    localStorage.setItem('quizHistory', JSON.stringify(history));
}

function updateHomeStats() {
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const total = history.length;
    const wins = history.filter(h => h.result === 'Win').length;
    const percent = total === 0 ? 0 : Math.round((wins / total) * 100);

    const statTotal = document.getElementById('stat-total');
    if(statTotal) {
        statTotal.innerText = total;
        document.getElementById('stat-wins').innerText = wins;
        document.getElementById('stat-percent').innerText = `${percent}%`;
    }
}

window.showHistory = function() {
    hideAllViews();
    document.getElementById('history-view').classList.remove('d-none');
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    
    list.innerHTML = '';
    if(history.length === 0) {
        list.innerHTML = '<li class="list-group-item">No history found.</li>';
        return;
    }

    history.forEach(h => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <span>${h.date}</span>
            <span class="badge ${h.result === 'Win' ? 'bg-success' : 'bg-danger'} rounded-pill">${h.score}%</span>
        `;
        list.appendChild(li);
    });
}

// Make explicit global so HTML can call it
window.showHome = showHome;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}