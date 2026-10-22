const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const documentInput = document.getElementById("documentInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const clearButton = document.getElementById("clearButton");
const themeButton = document.getElementById("themeButton");
const loadingIndicator = document.getElementById("loadingIndicator");

const uploadedFileNames = new Set();

let documentList = document.getElementById("documentList");

if (!documentList) {
    documentList = document.createElement("div");
    documentList.id = "documentList";
    documentList.className = "uploaded-documents";

    const heading = document.createElement("h5");
    heading.textContent = "Uploaded Documents";

    const list = document.createElement("ul");
    list.id = "uploadedFileList";
    list.className = "list-group";

    documentList.appendChild(heading);
    documentList.appendChild(list);
    uploadStatus.insertAdjacentElement("afterend", documentList);
}

let uploadedFileList = document.getElementById("uploadedFileList");

if (!uploadedFileList) {
    uploadedFileList = document.createElement("ul");
    uploadedFileList.id = "uploadedFileList";
    uploadedFileList.className = "list-group";
    documentList.appendChild(uploadedFileList);
}

function updateDocumentList() {
    uploadedFileList.replaceChildren();

    if (uploadedFileNames.size === 0) {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = "No documents uploaded yet.";
        uploadedFileList.appendChild(item);
        return;
    }

    uploadedFileNames.forEach(function (fileName) {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = "📄 " + fileName;
        uploadedFileList.appendChild(item);
    });
}

updateDocumentList();

function addMessage(sender, text) {
    const message = document.createElement("div");
    message.classList.add("message");

    if (sender === "You") {
        message.classList.add("user-message");
    } else {
        message.classList.add("ai-message");
    }

    const heading = document.createElement("strong");
    heading.textContent = sender;

    const paragraph = document.createElement("p");
    paragraph.classList.add("mb-0");
    paragraph.textContent = text;

    message.appendChild(heading);
    message.appendChild(paragraph);
    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const question = questionInput.value.trim();

    if (!question) {
        alert("Please type a question first.");
        return;
    }

    addMessage("You", question);
    questionInput.value = "";
    loadingIndicator.hidden = false;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question: question })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Something went wrong."
            );
        }

        addMessage("Docta AI", result.answer);

    } catch (error) {
        addMessage(
            "Docta AI",
            "Sorry, I couldn't answer your question. " +
            error.message
        );
    } finally {
        loadingIndicator.hidden = true;
    }
});

uploadButton.addEventListener("click", async function () {
    const files = Array.from(documentInput.files);
    const allowedExtensions = [".pdf", ".txt", ".docx", ".csv"];

    if (files.length === 0) {
        uploadStatus.textContent =
            "Please choose at least one document.";
        return;
    }

    const invalidFiles = files.filter(function (file) {
        const name = file.name.toLowerCase();

        return !allowedExtensions.some(function (extension) {
            return name.endsWith(extension);
        });
    });

    if (invalidFiles.length > 0) {
        uploadStatus.textContent =
            "Unsupported file(s): " +
            invalidFiles.map(file => file.name).join(", ");
        return;
    }

    const formData = new FormData();

    files.forEach(function (file) {
        formData.append("documents", file);
    });

    uploadButton.disabled = true;
    uploadStatus.textContent =
        "Uploading and reading documents...";

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Upload failed."
            );
        }

        result.documents.forEach(function (fileName) {
            uploadedFileNames.add(fileName);
        });

        updateDocumentList();

        uploadStatus.textContent =
            result.message +
            " Documents listed: " + uploadedFileNames.size +
            ". Text chunks indexed in this upload: " +
            result.chunks + ".";

        documentInput.value = "";

    } catch (error) {
        uploadStatus.textContent =
            "Error: " + error.message;
    } finally {
        uploadButton.disabled = false;
    }
});

themeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark =
        document.body.classList.contains("dark-mode");

    themeButton.textContent = isDark
        ? "☀️ Light mode"
        : "🌙 Dark mode";
});

clearButton.addEventListener("click", function () {
    chatMessages.replaceChildren();

    addMessage(
        "Docta AI",
        "Chat cleared. Your uploaded documents remain available."
    );
});

