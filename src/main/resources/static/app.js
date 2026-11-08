
const API_URL = "http://localhost:8081/api";

let currentProjectId = localStorage.getItem("ghostcutProjectId");

const WORDS_PER_SECOND = 2.5;
const MAX_HOOK_SECONDS = 3;

const MAIN_SEGMENTS = [
    "Visual Hook",
    "Core Value",
    "CTA/Loop"
];

// ------------------------------
// HELPER FUNCTIONS
// ------------------------------

function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateDuration(text) {
    return countWords(text) / WORDS_PER_SECOND;
}

function formatDuration(seconds) {
    return `${seconds.toFixed(1)}s`;
}

// ------------------------------
// CREATE PROJECT
// ------------------------------

async function createProject() {

    const title = document.getElementById("projectTitle").value.trim();
    const platform = document.getElementById("projectPlatform").value;
    const status = document.getElementById("projectStatus");

    if (!title) {
        alert("Please enter a project title.");
        return;
    }

    try {

        status.textContent = "Creating project...";

        const response = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, platform })
        });

        if (!response.ok) {
            throw new Error("Project creation failed.");
        }

        const project = await response.json();

        currentProjectId = String(project.id);

        localStorage.setItem("ghostcutProjectId", currentProjectId);

        status.textContent = `Project Created! ID: ${currentProjectId}`;

        document.getElementById("draftingSection").style.display = "block";
        document.getElementById("timelineSection").style.display = "block";

        validateHook();
        updatePacing();

        await loadTimeline();

    } catch (error) {

        console.error("Project error:", error);

        status.textContent = "Unable to create project. Check your backend.";
    }
}

// ------------------------------
// HOOK ANALYSIS
// ------------------------------

function validateHook() {

    const hookText = document.getElementById("hookContent").value.trim();
    const warning = document.getElementById("hookWarning");
    const durationLabel = document.getElementById("hookDuration");

    const wordCount = countWords(hookText);
    const duration = calculateDuration(hookText);

    durationLabel.textContent = `0–${duration.toFixed(1)} SEC`;

    if (!hookText) {

        warning.style.display = "none";
        warning.textContent = "";

        updatePacing();
        return;
    }

    if (duration > MAX_HOOK_SECONDS) {

        warning.textContent =
            `⚠ Your hook takes approximately ${duration.toFixed(1)} seconds. ` +
            "Try making it shorter to fit the 3-second target.";

        warning.style.display = "block";

    } else if (wordCount < 3) {

        warning.textContent =
            "Consider adding a little more context to make your opening clearer.";

        warning.style.display = "block";

    } else {

        warning.textContent =
            "✓ Good! Your hook fits the 3-second target.";

        warning.style.display = "block";
    }

    updatePacing();
}

// ------------------------------
// PACING ANALYSIS
// ------------------------------

function updatePacing() {

    const hook = document.getElementById("hookContent").value;
    const core = document.getElementById("coreContent").value;
    const cta = document.getElementById("ctaContent").value;

    const hookDuration = calculateDuration(hook);
    const coreDuration = calculateDuration(core);
    const ctaDuration = calculateDuration(cta);

    const totalWords =
        countWords(hook) +
        countWords(core) +
        countWords(cta);

    const totalDuration =
        hookDuration +
        coreDuration +
        ctaDuration;

    const pacingDisplay = document.getElementById("pacingDisplay");

    pacingDisplay.textContent =
        `HOOK: ${formatDuration(hookDuration)} | ` +
        `CORE: ${formatDuration(coreDuration)} | ` +
        `CTA: ${formatDuration(ctaDuration)} | ` +
        `TOTAL: ${formatDuration(totalDuration)} | ` +
        `WORDS: ${totalWords} | ` +
        `SPEAKING PACE: ${WORDS_PER_SECOND} words/sec`;
}

// ------------------------------
// SAVE STORYBOARD SEGMENTS
// ------------------------------

async function saveFrames() {

    if (!currentProjectId) {
        alert("Create a project first!");
        return;
    }

    const frames = [

        {
            segmentType: "Visual Hook",
            content: document.getElementById("hookContent").value.trim(),
            duration: calculateDuration(
                document.getElementById("hookContent").value
            )
        },

        {
            segmentType: "Core Value",
            content: document.getElementById("coreContent").value.trim(),
            duration: calculateDuration(
                document.getElementById("coreContent").value
            )
        },

        {
            segmentType: "CTA/Loop",
            content: document.getElementById("ctaContent").value.trim(),
            duration: calculateDuration(
                document.getElementById("ctaContent").value
            )
        }
    ];

    const validFrames = frames.filter(
        frame => frame.content.length > 0
    );

    if (validFrames.length === 0) {
        alert("Please enter some script content first.");
        return;
    }

    try {

        const existingResponse = await fetch(
            `${API_URL}/storyboard/${currentProjectId}`
        );

        if (!existingResponse.ok) {
            throw new Error("Unable to fetch existing storyboard.");
        }

        const existingFrames = await existingResponse.json();

        const existingMap = new Map();

        existingFrames
            .sort((a, b) => Number(a.id) - Number(b.id))
            .forEach(frame => {
                existingMap.set(frame.segmentType, frame);
            });

        for (const frame of validFrames) {

            const existingFrame = existingMap.get(frame.segmentType);

            const url = existingFrame
                ? `${API_URL}/frames/${currentProjectId}/${existingFrame.id}`
                : `${API_URL}/frames/${currentProjectId}`;

            const response = await fetch(url, {

                method: existingFrame ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(frame)
            });

            if (!response.ok) {
                throw new Error(`Failed to save ${frame.segmentType}`);
            }
        }

        alert("Storyboard saved successfully!");

        await loadTimeline();

    } catch (error) {

        console.error("Save error:", error);

        alert("Unable to save storyboard. Check the backend.");
    }
}

// ------------------------------
// LOAD VISUAL STORYBOARD
// ------------------------------

async function loadTimeline() {

    if (!currentProjectId) return;

    const container = document.getElementById("timelineContainer");

    try {

        const response = await fetch(
            `${API_URL}/storyboard/${currentProjectId}`
        );

        if (!response.ok) {
            throw new Error("Unable to load storyboard.");
        }

        const frames = await response.json();

        container.innerHTML = "";

        // SCENE MANAGEMENT

        const management = document.createElement("div");

        management.className = "scene-management";

        const addButton = document.createElement("button");

        addButton.className = "add-scene-button";
        addButton.textContent = "+ Add Scene";
        addButton.onclick = addScene;

        management.appendChild(addButton);
        container.appendChild(management);

        if (!frames.length) {

            const emptyMessage = document.createElement("p");

            emptyMessage.textContent =
                "No storyboard segments saved yet.";

            container.appendChild(emptyMessage);

            return;
        }

        // SORT SCENES

        frames.sort((a, b) => Number(a.id) - Number(b.id));

        // IDENTIFY LATEST MAIN SEGMENTS

        const latestMainFrames = new Map();

        frames.forEach(frame => {

            if (MAIN_SEGMENTS.includes(frame.segmentType)) {
                latestMainFrames.set(frame.segmentType, frame);
            }
        });

        // RESTORE MAIN SCRIPT CONTENT

        latestMainFrames.forEach(frame => {

            if (frame.segmentType === "Visual Hook") {
                document.getElementById("hookContent").value =
                    frame.content || "";
            }

            if (frame.segmentType === "Core Value") {
                document.getElementById("coreContent").value =
                    frame.content || "";
            }

            if (frame.segmentType === "CTA/Loop") {
                document.getElementById("ctaContent").value =
                    frame.content || "";
            }
        });

        // KEEP CUSTOM SCENES AND LATEST MAIN SEGMENTS

        const displayFrames = frames.filter(frame => {

            if (!MAIN_SEGMENTS.includes(frame.segmentType)) {
                return true;
            }

            const latestFrame = latestMainFrames.get(frame.segmentType);

            return String(latestFrame.id) === String(frame.id);
        });

        validateHook();
        updatePacing();

        // RENDER TIMELINE

        let currentTime = 0;

        displayFrames.forEach((frame, index) => {

            const duration = Number(frame.duration) || 0;

            const startTime = currentTime;
            const endTime = currentTime + duration;

            const card = document.createElement("div");

            card.className = "timeline-card";
            card.dataset.sceneId = frame.id;

            // HEADER

            const header = document.createElement("div");

            header.className = "timeline-card-header";

            const title = document.createElement("strong");

            title.textContent = frame.segmentType;

            const time = document.createElement("span");

            time.className = "timeline-time";

            time.textContent =
                `${startTime.toFixed(1)}s – ${endTime.toFixed(1)}s`;

            // PROGRESS BAR

            const progress = document.createElement("div");

            progress.className = "timeline-progress";

            const bar = document.createElement("div");

            bar.className =
                `timeline-bar segment-${(index % 6) + 1}`;

            bar.style.width = `${Math.max(duration * 10, 2)}%`;

            progress.appendChild(bar);

            // SCENE CONTENT

            const content = document.createElement("p");

            content.className = "timeline-content";

            content.textContent = frame.content || "";

            header.append(title, time);

            card.append(header, progress, content);

            // EDIT AND DELETE BUTTONS FOR CUSTOM SCENES

            if (!MAIN_SEGMENTS.includes(frame.segmentType)) {

                const actions = document.createElement("div");

                actions.className = "scene-actions";

                // EDIT BUTTON

                const editButton = document.createElement("button");

                editButton.type = "button";
                editButton.textContent = "Edit";
                editButton.className = "scene-action-button";

                editButton.onclick = () => editScene(frame);

                // DELETE BUTTON

                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Delete";

                deleteButton.className =
                    "scene-action-button delete-scene-button";

                deleteButton.style.backgroundColor = "#dc3545";
                deleteButton.style.color = "#ffffff";

                deleteButton.onclick = () => {
                    deleteScene(frame, deleteButton);
                };

                actions.append(editButton, deleteButton);

                card.appendChild(actions);
            }

            // APPEND COMPLETE CARD

            container.appendChild(card);

            currentTime = endTime;
        });

    } catch (error) {

        console.error("Timeline error:", error);

        container.textContent =
            "Unable to load storyboard. Please check your backend.";
    }
}

// ------------------------------
// DELETE CUSTOM SCENE
// ------------------------------

async function deleteScene(frame, deleteButton) {

    if (MAIN_SEGMENTS.includes(frame.segmentType)) {
        alert("Main storyboard segments cannot be deleted.");
        return;
    }

    if (!currentProjectId) {
        alert("No project is currently selected.");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${frame.segmentType}"?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    try {

        deleteButton.disabled = true;
        deleteButton.textContent = "Deleting...";

        const response = await fetch(
            `${API_URL}/frames/${currentProjectId}/${frame.id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete scene.");
        }

        alert("Scene deleted successfully!");

        await loadTimeline();

    } catch (error) {

        console.error("Delete scene error:", error);

        alert("Unable to delete scene. Please check the backend.");

        deleteButton.disabled = false;
        deleteButton.textContent = "Delete";
    }
}

// ------------------------------
// LIVE INPUT LISTENERS
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {

    const hook = document.getElementById("hookContent");
    const core = document.getElementById("coreContent");
    const cta = document.getElementById("ctaContent");

    hook.addEventListener("input", validateHook);
    core.addEventListener("input", updatePacing);
    cta.addEventListener("input", updatePacing);

    // RESTORE PREVIOUS PROJECT

    if (currentProjectId) {

        document.getElementById("draftingSection").style.display = "block";

        document.getElementById("timelineSection").style.display = "block";

        document.getElementById("projectStatus").textContent =
            `Restored Project! ID: ${currentProjectId}`;

        loadTimeline();
    }

    validateHook();
    updatePacing();
});

// ------------------------------
// ADD NEW SCENE
// ------------------------------

async function addScene() {

    if (!currentProjectId) {
        alert("Please create a project first.");
        return;
    }

    const container = document.getElementById("timelineContainer");

    if (document.querySelector(".scene-editor")) return;

    const editor = document.createElement("div");

    editor.className = "scene-editor";

    const heading = document.createElement("h3");
    heading.textContent = "Add New Scene";

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Scene Title";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Example: Product Introduction";

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Scene Description";

    const contentInput = document.createElement("textarea");
    contentInput.placeholder = "Describe what happens in this scene...";

    const durationLabel = document.createElement("label");
    durationLabel.textContent = "Duration (seconds)";

    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.min = "0.1";
    durationInput.step = "0.1";
    durationInput.placeholder = "Example: 5";

    const actions = document.createElement("div");
    actions.className = "scene-editor-actions";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Scene";
    saveButton.className = "add-scene-button";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "secondary-button";

    cancelButton.onclick = () => editor.remove();

    // SAVE NEW SCENE

    saveButton.onclick = async () => {

        const segmentType = titleInput.value.trim();
        const content = contentInput.value.trim();
        const duration = Number(durationInput.value);

        if (!segmentType || !content || !duration || duration <= 0) {

            alert("Please enter a title, description, and valid duration.");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {

            const response = await fetch(
                `${API_URL}/frames/${currentProjectId}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        segmentType,
                        content,
                        duration
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Failed to create scene.");
            }

            alert("New scene added successfully!");

            await loadTimeline();

        } catch (error) {

            console.error("Add scene error:", error);

            alert("Unable to add scene. Please check the backend.");

            saveButton.disabled = false;
            saveButton.textContent = "Save Scene";
        }
    };

    actions.append(saveButton, cancelButton);

    editor.append(
        heading,
        titleLabel,
        titleInput,
        contentLabel,
        contentInput,
        durationLabel,
        durationInput,
        actions
    );

    container.appendChild(editor);

    titleInput.focus();
}

// ------------------------------
// EDIT EXISTING SCENE
// ------------------------------

async function editScene(frame) {

    if (document.querySelector(".scene-editor")) return;

    const editor = document.createElement("div");

    editor.className = "scene-editor";

    const heading = document.createElement("h3");
    heading.textContent = "Edit Scene";

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Scene Title";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = frame.segmentType;

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Scene Description";

    const contentInput = document.createElement("textarea");
    contentInput.value = frame.content || "";

    const durationLabel = document.createElement("label");
    durationLabel.textContent = "Duration (seconds)";

    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.min = "0.1";
    durationInput.step = "0.1";
    durationInput.value = frame.duration;

    const actions = document.createElement("div");
    actions.className = "scene-editor-actions";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Update Scene";
    saveButton.className = "add-scene-button";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "secondary-button";

    cancelButton.onclick = () => editor.remove();

    // UPDATE SCENE

    saveButton.onclick = async () => {

        const segmentType = titleInput.value.trim();
        const content = contentInput.value.trim();
        const duration = Number(durationInput.value);

        if (!segmentType || !content || !duration || duration <= 0) {

            alert("Please enter a title, description, and valid duration.");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Updating...";

        try {

            const response = await fetch(
                `${API_URL}/frames/${currentProjectId}/${frame.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        segmentType,
                        content,
                        duration
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update scene.");
            }

            alert("Scene updated successfully!");

            await loadTimeline();

        } catch (error) {

            console.error("Edit scene error:", error);

            alert("Unable to edit scene. Please check the backend.");

            saveButton.disabled = false;
            saveButton.textContent = "Update Scene";
        }
    };

    actions.append(saveButton, cancelButton);

    editor.append(
        heading,
        titleLabel,
        titleInput,
        contentLabel,
        contentInput,
        durationLabel,
        durationInput,
        actions
    );

    // PLACE EDITOR BELOW ITS SCENE CARD

    const card = document.querySelector(
        `[data-scene-id="${frame.id}"]`
    );

    if (card) {

        card.appendChild(editor);
        titleInput.focus();

    } else {

        console.error("Scene card not found:", frame.id);
    }
}
