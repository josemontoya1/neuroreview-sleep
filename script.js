// Navigation Logic
const navLinks = document.querySelectorAll('.nav-links li');
const panels = document.querySelectorAll('.panel');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const target = link.getAttribute('data-target');
        navigateTo(target);
    });
});

function navigateTo(targetId) {
    // Update active nav
    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
        }
    });

    // Update active panel
    panels.forEach(panel => {
        panel.classList.remove('active-section');
        if(panel.id === targetId) {
            panel.classList.add('active-section');
        }
    });
}

// Circadian Rhythm Logic
const timeSlider = document.getElementById('timeSlider');
const timeDisplay = document.getElementById('timeDisplay');
const cycleIndicator = document.getElementById('cycleIndicator');
const melatoninFill = document.getElementById('melatoninFill');
const cortisolFill = document.getElementById('cortisolFill');

timeSlider.addEventListener('input', (e) => {
    const hours = parseFloat(e.target.value);
    
    // Format Time Display
    let displayHour = Math.floor(hours);
    const ampm = displayHour >= 12 && displayHour < 24 ? 'PM' : 'AM';
    if(displayHour === 0) displayHour = 12;
    if(displayHour > 12) displayHour -= 12;
    
    // Minutes handling
    const minutes = (hours % 1) === 0.5 ? '30' : '00';
    timeDisplay.textContent = `${displayHour}:${minutes} ${ampm}`;

    // Position Sun/Moon
    const percentage = (hours / 24) * 100;
    const yOffset = -Math.sin((hours / 24) * Math.PI) * 100;
    
    cycleIndicator.style.left = `${percentage}%`;
    cycleIndicator.style.bottom = `${yOffset - 20}px`;

    // Change Sun/Moon visual based on time
    if(hours >= 6 && hours <= 18) {
        cycleIndicator.style.background = '#fbbf24'; // Sun
        cycleIndicator.style.boxShadow = '0 0 30px #fbbf24';
    } else {
        cycleIndicator.style.background = '#e2e8f0'; // Moon
        cycleIndicator.style.boxShadow = '0 0 20px #e2e8f0';
    }

    // Hormone levels calculation
    let melatonin = 0;
    if(hours > 18 || hours < 6) {
        melatonin = hours > 18 ? ((hours - 18) / 6) * 100 : (1 - (hours / 6)) * 100;
    }
    
    let cortisol = 0;
    if(hours >= 4 && hours <= 12) {
        cortisol = ((hours - 4) / 8) * 100; 
    } else if (hours > 12 && hours <= 24) {
        cortisol = 100 - (((hours - 12) / 12) * 80); 
    } else {
        cortisol = 20; 
    }

    melatoninFill.style.width = `${Math.max(10, melatonin)}%`;
    cortisolFill.style.width = `${Math.max(10, cortisol)}%`;
});

// Initialize slider
timeSlider.dispatchEvent(new Event('input'));

// Sleep Stages Tabs Logic
const stageTabs = document.querySelectorAll('.stage-tab');
const stageContents = document.querySelectorAll('.stage-content');

stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class
        stageTabs.forEach(t => t.classList.remove('active'));
        stageContents.forEach(c => c.classList.remove('active'));

        // Add active class
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-stage') + '-content';
        document.getElementById(targetId).classList.add('active');
    });
});

// Simulation Quiz Logic
const quizData = [
    {
        scenario: "The EEG shows sleep spindles and K-complexes. The patient's heart rate is slowing and body temperature is dropping.",
        correctAnswer: "stage2",
        waveClass: "spindle-wave",
        lesson: "NREM-2 (Light Sleep) makes up about 50% of your night. It is characterized by sleep spindles (bursts of brain activity) and K-complexes. It's a slightly deeper sleep than NREM-1, but you can still be awakened relatively easily."
    },
    {
        scenario: "The EEG shows slow, high-amplitude delta waves. The patient is very difficult to wake up, and their body is repairing tissues and releasing growth hormone.",
        correctAnswer: "stage3",
        waveClass: "delta-wave",
        lesson: "NREM-3 is the deepest stage of sleep, also known as slow-wave sleep due to the presence of delta waves. This is the most physically restorative stage where tissue repair and immune strengthening occur. It's very difficult to wake someone from this stage."
    },
    {
        scenario: "The patient is experiencing rapid eye movements beneath closed lids. Their heart rate is elevated and their breathing is irregular, but their voluntary muscles are completely paralyzed.",
        correctAnswer: "rem",
        waveClass: "rem-wave",
        lesson: "REM (Rapid Eye Movement) sleep is known as paradoxical sleep. While your brain is highly active (similar to wakefulness) and you experience vivid dreams, your body experiences REM atonia (muscle paralysis) to prevent you from acting out those dreams. It is crucial for memory consolidation."
    },
    {
        scenario: "The patient is just drifting off to sleep. Their brain waves are slowing into theta waves, and they suddenly experience a hypnic jerk (muscle spasm).",
        correctAnswer: "stage1",
        waveClass: "theta-wave",
        lesson: "NREM-1 is the transitional stage between wakefulness and sleep. It lasts only 5-10 minutes. During this light sleep stage, you might experience hypnagogic sensations like falling, which can trigger a sudden muscle contraction known as a hypnic jerk."
    }
];

let currentQuestion = 0;
let score = 0;

const quizScreen = document.getElementById('quiz-screen');
const quizFeedback = document.getElementById('quiz-feedback');
const quizResults = document.getElementById('quiz-results');

const questionText = document.getElementById('question-text');
const quizWave = document.getElementById('quiz-wave');
const quizBtns = document.querySelectorAll('.quiz-btn');

const feedbackTitle = document.getElementById('feedback-title');
const feedbackText = document.getElementById('feedback-text');
const miniLesson = document.getElementById('mini-lesson');
const miniLessonText = document.getElementById('mini-lesson-text');
const nextQuestionBtn = document.getElementById('next-question-btn');
const scoreText = document.getElementById('score-text');
const restartQuizBtn = document.getElementById('restart-quiz-btn');

let eegAnimationId;

function drawEEG(type) {
    const canvas = document.getElementById('eeg-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear previous
    if(eegAnimationId) cancelAnimationFrame(eegAnimationId);
    
    let time = 0;
    const history = new Array(width).fill(height/2);
    
    function generatePoint() {
        time += 0.05;
        let y = height / 2;
        
        if (type === 'theta-wave') {
            // NREM-1: 4-7 Hz, mixed low amplitude
            y += Math.sin(time * 2) * 10 + Math.sin(time * 5) * 5 + (Math.random() - 0.5) * 10;
        } else if (type === 'spindle-wave') {
            // NREM-2: Background theta + occasional spindle + K-complex
            y += Math.sin(time * 1.5) * 8 + (Math.random() - 0.5) * 8;
            // Spindle burst
            if (time % 10 > 8) {
                y += Math.sin(time * 15) * 20; 
            }
            // K-complex
            if (time % 10 > 4 && time % 10 < 4.5) {
                let kTime = (time % 10) - 4;
                y -= Math.sin(kTime * Math.PI * 2) * 40; 
            }
        } else if (type === 'delta-wave') {
            // NREM-3: 0.5-2 Hz, high amplitude
            y += Math.sin(time * 0.8) * 35 + Math.sin(time * 0.3) * 15 + (Math.random() - 0.5) * 5;
        } else if (type === 'rem-wave') {
            // REM: Sawtooth, low amplitude, high frequency bursts
            y += Math.sin(time * 3) * 5 + (Math.random() - 0.5) * 15;
            if (Math.random() > 0.95) y += (Math.random() - 0.5) * 20; // Eye movement artifacts
        }
        
        // Clamping
        return Math.max(10, Math.min(height - 10, y));
    }
    
    function animate() {
        // Shift history left
        history.shift();
        history.push(generatePoint());
        
        // Draw
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Grid lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for(let i=0; i<width; i+=50) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for(let i=0; i<height; i+=25) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }
        
        // EEG Line
        ctx.strokeStyle = '#14b8a6'; // Cyan trace
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, history[0]);
        for(let i=1; i<width; i++) {
            ctx.lineTo(i, history[i]);
        }
        ctx.stroke();
        
        eegAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

function loadQuestion() {
    if (!quizScreen) return;
    
    quizScreen.classList.remove('hidden');
    quizFeedback.classList.add('hidden');
    quizResults.classList.add('hidden');
    
    const q = quizData[currentQuestion];
    questionText.textContent = q.scenario;
    drawEEG(q.waveClass);
}

quizBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const selected = e.target.getAttribute('data-answer');
        checkAnswer(selected);
    });
});

function checkAnswer(selected) {
    const q = quizData[currentQuestion];
    quizScreen.classList.add('hidden');
    quizFeedback.classList.remove('hidden');
    
    if (selected === q.correctAnswer) {
        score++;
        feedbackTitle.textContent = "Correct! 🎉";
        feedbackTitle.className = "feedback-correct";
        feedbackText.textContent = "Great job diagnosing this stage.";
        miniLesson.classList.add('hidden');
    } else {
        feedbackTitle.textContent = "Incorrect";
        feedbackTitle.className = "feedback-incorrect";
        feedbackText.textContent = "You misdiagnosed the patient.";
        miniLesson.classList.remove('hidden');
        miniLessonText.textContent = q.lesson;
    }
}

if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', () => {
        currentQuestion++;
        if (currentQuestion < quizData.length) {
            loadQuestion();
        } else {
            showResults();
        }
    });
}

function showResults() {
    quizScreen.classList.add('hidden');
    quizFeedback.classList.add('hidden');
    quizResults.classList.remove('hidden');
    
    scoreText.innerHTML = `You correctly diagnosed <strong>${score}</strong> out of <strong>${quizData.length}</strong> patients!`;
}

if (restartQuizBtn) {
    restartQuizBtn.addEventListener('click', () => {
        currentQuestion = 0;
        score = 0;
        loadQuestion();
    });
}

// Initialize first question
loadQuestion();

// Clinic Simulator Logic
const clinicData = [
    {
        patient: "Patient #1",
        quote: "I often stop breathing for a few seconds in the middle of the night, then wake up gasping for air. I feel exhausted all day.",
        correctDiagnosis: "Sleep Apnea",
        explanation: "Sleep Apnea is characterized by repeated pauses in breathing during sleep, which leads to micro-awakenings and severe daytime fatigue."
    },
    {
        patient: "Patient #2",
        quote: "Whenever I get really excited or laugh hard, my muscles go completely limp and I collapse. I also fall asleep randomly during the day.",
        correctDiagnosis: "Narcolepsy",
        explanation: "Narcolepsy often involves 'cataplexy'—a sudden loss of muscle tone triggered by strong emotions. This is a classic AP Exam keyword!"
    },
    {
        patient: "Patient #3",
        quote: "I lie awake for hours every night, unable to fall asleep no matter how tired I am. I rarely get a full night's rest.",
        correctDiagnosis: "Insomnia",
        explanation: "Insomnia is the inability to fall asleep or stay asleep. It is the most common sleep disorder."
    },
    {
        patient: "Patient #4",
        quote: "Right as I'm trying to fall asleep, I get an overwhelming, uncomfortable 'crawling' sensation in my legs that forces me to get up and move them.",
        correctDiagnosis: "Restless Leg Syndrome",
        explanation: "Restless Leg Syndrome (RLS) causes an irresistible urge to move the legs, especially at night, disrupting the onset of sleep."
    },
    {
        patient: "Patient #5",
        quote: "My husband says I snore extremely loudly, and he notices pauses in my breathing while I sleep.",
        correctDiagnosis: "Sleep Apnea",
        explanation: "Loud snoring combined with pauses in breathing is the hallmark symptom of Obstructive Sleep Apnea."
    },
    {
        patient: "Patient #6",
        quote: "I have these sudden, irresistible 'sleep attacks' where I plunge directly into REM sleep, even in the middle of a conversation.",
        correctDiagnosis: "Narcolepsy",
        explanation: "Narcoleptic 'sleep attacks' bypass NREM stages entirely and go straight into REM sleep, making them highly intrusive."
    },
    {
        patient: "Patient #7",
        quote: "I wake up multiple times throughout the night and have a very difficult time falling back asleep, leaving me irritable the next day.",
        correctDiagnosis: "Insomnia",
        explanation: "Insomnia isn't just about falling asleep; it also includes difficulty *staying* asleep (sleep maintenance insomnia)."
    },
    {
        patient: "Patient #8",
        quote: "My doctor told me I have abnormally low levels of a neurotransmitter called hypocretin (orexin). I struggle to stay awake during the day.",
        correctDiagnosis: "Narcolepsy",
        explanation: "Low hypocretin (orexin) levels in the brain are the biological cause of Narcolepsy. This is a frequent AP multiple-choice question."
    },
    {
        patient: "Patient #9",
        quote: "I am prescribed a CPAP machine to keep my airway open while I sleep, otherwise my blood oxygen levels drop dangerously low.",
        correctDiagnosis: "Sleep Apnea",
        explanation: "A Continuous Positive Airway Pressure (CPAP) machine is the primary treatment for Obstructive Sleep Apnea."
    },
    {
        patient: "Patient #10",
        quote: "I have trouble getting restorative sleep because I have to keep kicking and stretching my legs in bed to relieve an uncomfortable aching feeling.",
        correctDiagnosis: "Restless Leg Syndrome",
        explanation: "The aching or creeping sensations in the legs must be relieved by movement, which heavily disrupts sleep architecture."
    }
];

let currentPatient = 0;
let clinicScore = 0;

const clinicScreen = document.getElementById('clinic-screen');
const clinicFeedback = document.getElementById('clinic-feedback');
const clinicResults = document.getElementById('clinic-results');

const patientId = document.getElementById('patient-id');
const patientQuote = document.getElementById('patient-quote');
const clinicBtns = document.querySelectorAll('.clinic-btn');

const cFeedbackTitle = document.getElementById('c-feedback-title');
const cFeedbackText = document.getElementById('c-feedback-text');
const cExplanation = document.getElementById('c-explanation');
const nextPatientBtn = document.getElementById('next-patient-btn');
const cScoreText = document.getElementById('c-score-text');
const cPerfFill = document.getElementById('c-perf-fill');
const restartClinicBtn = document.getElementById('restart-clinic-btn');

function loadPatient() {
    if(!clinicScreen) return;
    
    clinicScreen.classList.remove('hidden');
    clinicFeedback.classList.add('hidden');
    clinicResults.classList.add('hidden');
    
    const p = clinicData[currentPatient];
    patientId.textContent = p.patient;
    patientQuote.textContent = `"${p.quote}"`;
}

clinicBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const selected = e.target.getAttribute('data-diagnosis');
        checkDiagnosis(selected);
    });
});

function checkDiagnosis(selected) {
    const p = clinicData[currentPatient];
    clinicScreen.classList.add('hidden');
    clinicFeedback.classList.remove('hidden');
    
    cExplanation.innerHTML = `<strong>AP Fact:</strong> ${p.explanation}`;
    
    if (selected === p.correctDiagnosis) {
        clinicScore++;
        cFeedbackTitle.textContent = "Accurate Diagnosis! 🩺";
        cFeedbackTitle.className = "feedback-correct";
        cFeedbackText.textContent = `You correctly diagnosed ${p.correctDiagnosis}.`;
    } else {
        cFeedbackTitle.textContent = "Misdiagnosis ⚠️";
        cFeedbackTitle.className = "feedback-incorrect";
        cFeedbackText.textContent = `You selected ${selected}, but the correct diagnosis is ${p.correctDiagnosis}.`;
    }
}

if(nextPatientBtn) {
    nextPatientBtn.addEventListener('click', () => {
        currentPatient++;
        if (currentPatient < clinicData.length) {
            loadPatient();
        } else {
            showClinicResults();
        }
    });
}

function showClinicResults() {
    clinicScreen.classList.add('hidden');
    clinicFeedback.classList.add('hidden');
    clinicResults.classList.remove('hidden');
    
    const percentage = (clinicScore / clinicData.length) * 100;
    cScoreText.innerHTML = `You correctly diagnosed <strong>${clinicScore}</strong> out of <strong>${clinicData.length}</strong> patients!`;
    
    setTimeout(() => {
        cPerfFill.style.width = `${percentage}%`;
    }, 100);
}

if(restartClinicBtn) {
    restartClinicBtn.addEventListener('click', () => {
        currentPatient = 0;
        clinicScore = 0;
        cPerfFill.style.width = '0%';
        loadPatient();
    });
}

// Initialize
loadPatient();

// --- Google Forms Integration ---
const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc6ULPQtxF9eb9tNYjHFc9TE9lXh1LcBDYCKij3tMK3ylRvwA/formResponse";
const ENTRY_NAME = "entry.1152256098"; 
const ENTRY_PERIOD = "entry.514329185";
const ENTRY_MODULE = "entry.1797924472";
const ENTRY_SCORE = "entry.590190009";

let studentInfo = {
    name: "",
    period: "Period 1"
};

// Modal Logic
const modal = document.getElementById('student-modal');
const startBtn = document.getElementById('start-simlab-btn');
const nameInput = document.getElementById('studentName');
const periodInput = document.getElementById('studentPeriod');

if(startBtn && modal) {
    startBtn.addEventListener('click', () => {
        if(nameInput.value.trim() === '') {
            alert("Please enter your name!");
            return;
        }
        studentInfo.name = nameInput.value.trim();
        studentInfo.period = periodInput.value;
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    });
}

// Generic Submission Function
function submitToGoogleForm(moduleName, scoreString, statusElementId, buttonId) {
    const statusEl = document.getElementById(statusElementId);
    const btnEl = document.getElementById(buttonId);
    
    if(!statusEl || !btnEl) return;
    
    statusEl.style.display = "block";
    statusEl.textContent = "Submitting to teacher...";
    btnEl.disabled = true;
    btnEl.style.opacity = "0.5";

    // Create the form data using the Google Form Entry IDs
    const formData = new FormData();
    formData.append(ENTRY_NAME, studentInfo.name);
    formData.append(ENTRY_PERIOD, studentInfo.period);
    formData.append(ENTRY_MODULE, moduleName);
    formData.append(ENTRY_SCORE, scoreString);

    // Send the data without expecting a standard web response
    fetch(GOOGLE_FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
    })
    .then(() => {
        statusEl.textContent = "✅ Score successfully submitted to your teacher!";
        statusEl.style.color = "#10b981"; // Green
    })
    .catch((error) => {
        statusEl.textContent = "❌ Error submitting. Please tell your teacher.";
        statusEl.style.color = "#ef4444"; // Red
        btnEl.disabled = false;
        btnEl.style.opacity = "1";
    });
}

// Bind submission buttons
const submitQuizBtn = document.getElementById('submit-quiz-score-btn');
if(submitQuizBtn) {
    submitQuizBtn.addEventListener('click', () => {
        const scoreStr = `${score} / ${quizData.length}`;
        submitToGoogleForm("Simulation Quiz", scoreStr, "quiz-submit-status", "submit-quiz-score-btn");
    });
}

const submitClinicBtn = document.getElementById('submit-clinic-score-btn');
if(submitClinicBtn) {
    submitClinicBtn.addEventListener('click', () => {
        const scoreStr = `${clinicScore} / ${clinicData.length}`;
        submitToGoogleForm("Clinic Simulator", scoreStr, "clinic-submit-status", "submit-clinic-score-btn");
    });
}
