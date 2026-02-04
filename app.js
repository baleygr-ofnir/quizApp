const LOCAL_STORAGE_KEY = "quizApp_quizzes";
const DEFAULT_QUIZZES = "quizzes.json";

let quizzes = [];
let activeQuiz = null;

let appHeaderText;
let quizListElement;
let quizListView;
let quizPlayView;
let quizTitleElement;
let quizFormElement;
let quizResultElement;
let quizSubmitButton;
let quizBackButton;

document.addEventListener("DOMContentLoaded", () => {
    appHeaderText = document.querySelector("#app-header-text");
    quizListElement = document.querySelector("#quiz-list");
    quizListView = document.querySelector("#quiz-list-view");
    quizPlayView = document.querySelector("#quiz-play-view");
    quizTitleElement = document.querySelector("#quiz-title");
    quizFormElement = document.querySelector("#quiz-form");
    quizResultElement = document.querySelector("#quiz-result");
    quizSubmitButton = document.querySelector("#quiz-submit-btn");
    quizBackButton = document.querySelector("#quiz-back-btn");

    appHeaderText.addEventListener("click", handleQuizBack);
    quizBackButton.addEventListener("click", handleQuizBack);
    quizSubmitButton.addEventListener("click", handleQuizSubmit);

    initApp();
});

async function initApp() {
    quizzes = await loadQuizzes();
    renderQuizList();
}

async function loadQuizzes() {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (raw) {
        try {
            const parsed = JSON.parsed(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // Fall through to default
        }
    }
    
    const response = await fetch(DEFAULT_QUIZZES);
    if (!response.ok) {
        throw new Error("Failed to load default quizzes");
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("Default quizzes JSON must be an array.");
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    
    return data;
}

function saveQuizzes(quizzesToSave) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quizzesToSave));
}

// RENDERING

function renderQuizList() {
    quizListElement.innerHTML = "";
    
    quizzes.forEach((quiz) => {
        const li = document.createElement("li");
        li.className = "quiz-list-item";

        const title = document.createElement("h3");
        title.textContent = quiz.title;

        const desc = document.createElement("p");
        desc.textContent = quiz.description;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Start quiz";
        button.addEventListener("click", () => {
            startQuiz(quiz.id);
        });

        li.appendChild(title);
        li.appendChild(desc);
        li.appendChild(button);

        quizListElement.appendChild(li);
    });
}

function startQuiz(quizId) {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    
    activeQuiz = quiz;

    quizTitleElement.textContent = quiz.title;
    quizFormElement.innerHTML = "";
    quizResultElement.textContent = "";

    quizListView.hidden = true;
    quizPlayView.hidden = false;
    quizBackButton.hidden = false;

    renderQuizQuestions(quiz);
}

function renderQuizQuestions(quiz) {
    quizFormElement.innerHTML = "";
    
    quiz.questions.forEach((question, questionIndex) => {
        
        const fieldset = document.createElement("fieldset");
        fieldset.className = "quiz-question";
        fieldset.dataset.questionId = question.id;
        
        const legend = document.createElement("legend");
        legend.textContent = `${questionIndex + 1}. ${question.text}`;
        fieldset.appendChild(legend);
        
        question.options.forEach((optionText, optionIndex) => {
            
            const optionId = `${quiz.id}-${question.id}-option-${optionIndex}`;
            
            const wrapper = document.createElement("div");
            wrapper.className = "quiz-option";
            
            const input = document.createElement("input");
            input.type = "radio";
            input.name = question.id;
            input.id = optionId;
            input.value = String(optionIndex);
            
            const label = document.createElement("label");
            label.htmlFor = optionId;
            if (question.text.toLowerCase().includes("chemical formula")) {
                // Condition to format any chemical formula properly
                const formatFormula = text => 
                    text.replace(/([A-Za-z])(\d+)/g, (_, letter, digits) => 
                        `${letter}<sub>${digits}</sub>`);
                label.innerHTML = formatFormula(optionText);
            } else {
                label.textContent = optionText;
            }

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            fieldset.appendChild(wrapper);
        });

        quizFormElement.appendChild(fieldset);
    });
}

function handleQuizSubmit() {
    if (!activeQuiz) return;

    let hasMissingAnswers = false;

    activeQuiz.questions.forEach(question => {
        const selector = `input[name="${question.id}"]:checked`;
        const selectedInput = quizFormElement.querySelector(selector);

        const fieldset = quizFormElement.querySelector(
            `fieldset.quiz-question[data-question-id="${question.id}"]`
        );
        
        if (fieldset) {
            fieldset.classList.remove("quiz-question--incomplete");
        }

        if (!selectedInput) {
            hasMissingAnswers = true;
            if (fieldset) {
                fieldset.classList.add("quiz-question--incomplete");
            }
        }
    });

    if (hasMissingAnswers) {
        quizResultElement.textContent = "Please answer all questions before submitting.";
        return;
    }

    let correctCount = 0;
    const totalQuestions = activeQuiz.questions.length;

    activeQuiz.questions.forEach(question => {
        const selector = `input[name="${question.id}"]:checked`;
        const selectedInput = quizFormElement.querySelector(selector);

        const selectedIndex = Number(selectedInput.value);
        if (selectedIndex === question.correctIndex) {
            correctCount++;
        }

        const percentage = Math.round((correctCount / totalQuestions) * 100);

        quizResultElement.textContent = `You scored ${correctCount} out of ${totalQuestions} ${percentage}%`;
    });
}

function handleQuizBack() {
    activeQuiz = null;

    quizTitleElement.textContent = "";
    quizFormElement.innerHTML = "";
    quizResultElement.textContent = "";

    quizPlayView.hidden = true;
    quizBackButton.hidden = true;
    quizListView.hidden = false;

    renderQuizList();
}