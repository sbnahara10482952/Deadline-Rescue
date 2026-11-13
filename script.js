let assessments =
    JSON.parse(localStorage.getItem('deadlineRescueAssessments')) || [];

function saveAssessments() {
    localStorage.setItem(
        'deadlineRescueAssessments',
        JSON.stringify(assessments)
    );
}


/* =========================================
   NAVIGATION
   ========================================= */

function showSection(sectionId) {

    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
    });

    const activeButton = Array.from(
        document.querySelectorAll('.nav-button')
    ).find(button =>
        button.getAttribute('onclick') ===
        `showSection('${sectionId}')`
    );

    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.setAttribute('aria-pressed', 'true');
    }
    renderAssessments();

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* =========================================
   PRIORITY CALCULATION
   ========================================= */

function calculatePriority(assessment) {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dueDate =
        new Date(`${assessment.dueDate}T00:00:00`);

    const daysLeft =
        Math.ceil(
            (dueDate - today) /
            (1000 * 60 * 60 * 24)
        );

    const difficultyScore = {
        Easy: 1,
        Medium: 2,
        Hard: 3
    }[assessment.difficulty] || 1;

    const studyScore =
        Math.min(
            Number(assessment.studyTime) || 1,
            5
        );

    let score = 0;

    if (daysLeft <= 2) {
        score += 5;
    } else if (daysLeft <= 5) {
        score += 4;
    } else if (daysLeft <= 10) {
        score += 2;
    } else {
        score += 1;
    }

    score += difficultyScore;

    score += studyScore >= 4 ? 2 : 1;

    return {
        score,
        daysLeft
    };
}


function getPriorityLabel(assessment) {

    const result =
        calculatePriority(assessment);

    if (result.score >= 8) {
        return 'High Priority';
    }

    if (result.score >= 5) {
        return 'Medium Priority';
    }

    return 'Low Priority';
}

/* =========================================
   DUE DATE VALIDATION
   ========================================= */

function setMinimumDueDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        today.getDate()
    ).padStart(2, '0');

    const minimumDate = `${year}-${month}-${day}`;

    document.getElementById('due-date').min = minimumDate;
}

/* =========================================
   DATE HELPERS
   ========================================= */

function formatDate(dateString) {

    const date =
        new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString(
        'en-ZA',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }
    );
}


function getDaysText(assessment) {

    const result =
        calculatePriority(assessment);

    const daysLeft =
        result.daysLeft;

    if (daysLeft < 0) {
        return `${Math.abs(daysLeft)} day(s) overdue`;
    }

    if (daysLeft === 0) {
        return 'Due today';
    }

    if (daysLeft === 1) {
        return 'Due tomorrow';
    }

    return `${daysLeft} days left`;
}


/* =========================================
   SECURITY / TEXT SAFETY
   ========================================= */

function escapeHtml(value) {

    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


/* =========================================
   ASSESSMENT CARD
   ========================================= */

function createAssessmentCard(assessment) {

    const priority =
        getPriorityLabel(assessment);

    const priorityClass =
        priority.toLowerCase().split(' ')[0];

    const statusClass =
        assessment.status
            .toLowerCase()
            .replace(' ', '-');

    return `
        <article class="assessment-card">

            <div class="assessment-main">

                <div class="assessment-topline">

                    ${
                        assessment.status !== 'Completed'
                            ? `
                                <span class="priority-badge ${priorityClass}">
                                     ${priority}
                                </span>
              `
                            : ''
                    }

                    <span class="status-badge ${statusClass}">
                        ${escapeHtml(assessment.status)}
                    </span>

            </div>

                <h4>
                    ${escapeHtml(assessment.name)}
                </h4>

                <div class="assessment-details">

                    <span>
                        <strong>Due:</strong>
                        ${formatDate(assessment.dueDate)}
                    </span>

                    <span>
                        <strong>Difficulty:</strong>
                        ${escapeHtml(assessment.difficulty)}
                    </span>

                    <span>
                        <strong>Study time:</strong>
                        ${escapeHtml(assessment.studyTime)}
                        hour(s)
                    </span>

                    <span>
                        <strong>Time:</strong>
                        ${getDaysText(assessment)}
                    </span>

                </div>

                ${
                    assessment.notes
                        ? `
                            <p class="assessment-notes">
                                ${escapeHtml(assessment.notes)}
                            </p>
                          `
                        : ''
                }

            </div>

            <div class="assessment-actions">

                ${
                    assessment.status === 'Outstanding'
                        ? `
                            <button
                                class="small-button primary-small"
                                onclick="changeStatus(
                                    '${assessment.id}',
                                    'In Progress'
                                )">
                                Start
                            </button>
                          `
                        : ''
                }

                ${
                    assessment.status === 'In Progress'
                        ? `
                            <button
                                class="small-button success-small"
                                onclick="changeStatus(
                                    '${assessment.id}',
                                    'Completed'
                                )">
                                Complete
                            </button>
                          `
                        : ''
                }

                <button
                    class="small-button secondary-small"
                    onclick="editAssessment('${assessment.id}')">
                    Edit
                </button>

                <button
                    class="small-button danger-small"
                    onclick="deleteAssessment('${assessment.id}')">
                    Delete
                </button>

            </div>

        </article>
    `;
}


/* =========================================
   DISPLAY LISTS
   ========================================= */

function renderList(
    elementId,
    items,
    emptyTitle,
    emptyText
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    if (items.length === 0) {

        element.innerHTML = `
            <div class="empty-state">

                <h4>${emptyTitle}</h4>

                <p>${emptyText}</p>

            </div>
        `;

        return;
    }

    element.innerHTML =
        items.map(createAssessmentCard).join('');
}


/* =========================================
   RENDER ALL ASSESSMENTS
   ========================================= */

function renderAssessments() {

    const activeAssessments =
        assessments.filter(
            item => item.status !== 'Completed'
        );

    const highPriority =
        activeAssessments
            .filter(
                item =>
                    getPriorityLabel(item) ===
                    'High Priority'
            )
            .sort(
                (a, b) =>
                    calculatePriority(b).score -
                    calculatePriority(a).score
            );

    const upcoming =
        activeAssessments
            .filter(
                item =>
                    item.status === 'Outstanding'
            )
            .sort(
                (a, b) =>
                    new Date(a.dueDate) -
                    new Date(b.dueDate)
            );

    const inProgress =
        activeAssessments.filter(
            item => item.status === 'In Progress'
        );

    const completed =
        assessments.filter(
            item => item.status === 'Completed'
        );

    renderList(
        'priority-list',
        highPriority,
        'No high-priority assessments',
        'Add an assessment to start planning your workload.'
    );

    renderList(
        'upcoming-list',
        upcoming,
        'No upcoming assessments',
        'Your upcoming assessments will appear here.'
    );

    renderList(
        'progress-list',
        inProgress,
        'Nothing in progress',
        'Start an assessment when you are ready to work on it.'
    );

    renderList(
        'completed-list',
        completed,
        'No completed assessments yet',
        'Completed assessments will appear here.'
    );

    document.getElementById('total-count').textContent =
        assessments.length;

    document.getElementById('priority-count').textContent =
        highPriority.length;

    document.getElementById('progress-count').textContent =
        inProgress.length;

    document.getElementById('completed-count').textContent =
        completed.length;
}


/* =========================================
   FORM FEEDBACK
   ========================================= */

function showMessage(
    message,
    type = 'success'
) {

    const messageBox =
        document.getElementById('form-message');

    messageBox.textContent = message;

    messageBox.className =
        `form-message ${type}`;
}


/* =========================================
   ADD / UPDATE ASSESSMENT
   ========================================= */

document
    .getElementById('assessment-form')
    .addEventListener(
        'submit',
        function (event) {

            event.preventDefault();

            const name =
                document
                    .getElementById('assessment-name')
                    .value
                    .trim();

            const dueDate =
                document
                    .getElementById('due-date')
                    .value;

            const difficulty =
                document
                    .getElementById('difficulty')
                    .value;

            const studyTime =
                document
                    .getElementById('study-time')
                    .value;

            const notes =
                document
                    .getElementById('notes')
                    .value
                    .trim();


            if (
                !name ||
                !dueDate ||
                !difficulty ||
                !studyTime
            ) {

                showMessage(
                    'Please complete all required fields before saving.',
                    'error'
                );

                return;
            }


            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const selectedDate =
                new Date(
                    `${dueDate}T00:00:00`
                );


            if (selectedDate < today) {

                showMessage(
                    'Please choose today or a future due date.',
                    'error'
                );

                return;
            }


            const editingId =
                this.dataset.editingId;


            if (editingId) {

                const assessment =
                    assessments.find(
                        item =>
                            item.id === editingId
                    );

                if (assessment) {

                    assessment.name =
                        name;

                    assessment.dueDate =
                        dueDate;

                    assessment.difficulty =
                        difficulty;

                    assessment.studyTime =
                        studyTime;

                    assessment.notes =
                        notes;
                }

                delete this.dataset.editingId;

                document.querySelector(
                    '#add-assessment h2'
                ).textContent =
                    'Add Assessment';

                document.querySelector(
                    '#add-assessment .welcome p'
                ).textContent =
                    'Enter your assessment details to add it to your planning list.';

                document.querySelector(
                    '#assessment-form .primary-button'
                ).textContent =
                    'Save Assessment';

                showMessage(
                    'Assessment updated successfully.'
                );

            } else {

                assessments.push({

                    id:
                        Date.now().toString(),

                    name,
                    dueDate,
                    difficulty,
                    studyTime,
                    notes,

                    status:
                        'Outstanding'
                });

                showMessage(
                    'Assessment added successfully.'
                );
            }


            saveAssessments();

            renderAssessments();

            this.reset();


            setTimeout(
                () => {

                    showSection(
                        'dashboard'
                    );

                    document.getElementById(
                        'form-message'
                    ).className =
                        'form-message';

                    document.getElementById(
                        'form-message'
                    ).textContent = '';

                },
                700
            );
        }
    );


/* =========================================
   CHANGE STATUS
   ========================================= */

function changeStatus(
    id,
    newStatus
) {

    const assessment =
        assessments.find(
            item => item.id === id
        );

    if (!assessment) {
        return;
    }

    assessment.status =
        newStatus;

    saveAssessments();

    renderAssessments();

    if (newStatus === 'Completed') {

        alert(
            'Great job! You completed this assessment.'
        );

    } else {

        alert(
            'Assessment moved to In Progress.'
        );
    }
}

/* =========================================
   CANCEL ADD / EDIT
   ========================================= */

function cancelAssessmentEdit() {
    const form = document.getElementById('assessment-form');

    delete form.dataset.editingId;
    form.reset();

    document.querySelector('#add-assessment h2').textContent =
        'Add Assessment';

    document.querySelector('#add-assessment .welcome p').textContent =
        'Enter your assessment details to add it to your planning list.';

    document.querySelector(
        '#assessment-form .primary-button'
    ).textContent = 'Save Assessment';

    const messageBox = document.getElementById('form-message');
    messageBox.textContent = '';
    messageBox.className = 'form-message';

    showSection('dashboard');
}


/* =========================================
   EDIT ASSESSMENT
   ========================================= */

function editAssessment(id) {

    const assessment =
        assessments.find(
            item => item.id === id
        );

    if (!assessment) {
        return;
    }

    document.getElementById(
        'assessment-name'
    ).value =
        assessment.name;

    document.getElementById(
        'due-date'
    ).value =
        assessment.dueDate;

    document.getElementById(
        'difficulty'
    ).value =
        assessment.difficulty;

    document.getElementById(
        'study-time'
    ).value =
        assessment.studyTime;

    document.getElementById(
        'notes'
    ).value =
        assessment.notes || '';


    const form =
        document.getElementById(
            'assessment-form'
        );

    form.dataset.editingId =
        id;


    document.querySelector(
        '#add-assessment h2'
    ).textContent =
        'Edit Assessment';

    document.querySelector(
        '#add-assessment .welcome p'
    ).textContent =
        'Update the assessment details and save your changes.';

    document.querySelector(
        '#assessment-form .primary-button'
    ).textContent =
        'Update Assessment';


    showSection(
        'add-assessment'
    );
}


/* =========================================
   DELETE ASSESSMENT
   ========================================= */

function deleteAssessment(id) {

    const assessment =
        assessments.find(
            item => item.id === id
        );

    if (!assessment) {
        return;
    }

    const confirmed =
        confirm(
            `Delete "${assessment.name}"? This action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    assessments =
        assessments.filter(
            item => item.id !== id
        );

    saveAssessments();

    renderAssessments();

    alert(
        'Assessment deleted successfully.'
    );
}

/* =========================================
   STUDY SUPPORT
   ========================================= */

function toggleSupportOptions() {

    const options =
        document.getElementById('support-options');

    const button =
        document.getElementById('support-button');

    const isExpanded =
        button.getAttribute('aria-expanded') === 'true';

    options.classList.toggle('hidden');

    button.setAttribute(
        'aria-expanded',
        String(!isExpanded)
    );

    button.textContent = isExpanded
        ? 'View Support Options'
        : 'Hide Support Options';
}


/* =========================================
   START APPLICATION
   ========================================= */

setMinimumDueDate();

renderAssessments();