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

    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedQuestions = [];
    let answerRevealed = false;
    let selectedChapters = [];

    // Initialize the app
    loadQuestions();

    // Event listeners
    startBtn.addEventListener('click', startQuiz);
    restartBtn.addEventListener('click', restartQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    revealBtn.addEventListener('click', revealAnswer);

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
            input.checked = true; // Default to checked
            
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
    }

    function startQuiz() {
        // Get selected chapters
        selectedChapters = getSelectedChapters();
        
        if (selectedChapters.length === 0) {
            alert('Please select at least one chapter');
            return;
        }
        
        // Reset variables
        currentQuestionIndex = 0;
        answerRevealed = false;
        
        // Select random questions from selected chapters
        selectedQuestions = selectRandomQuestions();
        
        if (selectedQuestions.length === 0) {
            alert('No questions found in selected chapters');
            return;
        }
        
        // Show quiz screen
        startScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        // Load first question
        loadQuestion();
    }

    function selectRandomQuestions() {
        // Filter questions by selected chapters
        let filteredQuestions = questions.filter(q => selectedChapters.includes(q.chapter));
        
        // Group by subject
        const part1Malayalam = filteredQuestions.filter(q => q.subject === "Part I Malayalam");
        const part2Malayalam = filteredQuestions.filter(q => q.subject === "Part II Malayalam");
        const english = filteredQuestions.filter(q => q.subject === "English");
        const maths = filteredQuestions.filter(q => q.subject === "Maths");
        const basicScience = filteredQuestions.filter(q => q.subject === "Basic Science");
        const socialScience = filteredQuestions.filter(q => q.subject === "Social Science");
        
        // Select questions (up to the requested number, but may be less if chapter doesn't have enough)
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

    // ... (rest of the JavaScript code remains the same as previous version)
    // Include all the other functions from the previous implementation
    // getRandomElements, loadQuestion, revealAnswer, nextQuestion, prevQuestion
});
