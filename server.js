const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const multer = require("multer");
const { extractText } = require("./services/documentProcessor");
const { addDocumentsToStore, searchDocuments } = require("./services/ragService");
const { ChatOllama } = require("@langchain/ollama");

const app = express();
const PORT = 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const allowedExtensions = [".pdf", ".txt", ".docx", ".csv"];
const uploadedDocuments = [];

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "AI Chatbot server is running!"
    });
});

app.get("/api/test-upload-route", (req, res) => {
    res.json({
        status: "success",
        message: "This server recognizes the test route."
    });
});

app.post("/api/upload", upload.array("documents", 10), async (req, res) => {
    console.log("UPLOAD ROUTE WAS CALLED");

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: "Please upload at least one document."
            });
        }

        const newDocuments = [];

        for (const file of req.files) {
            const fileName = file.originalname.toLowerCase();

            const isSupported = allowedExtensions.some(extension =>
                fileName.endsWith(extension)
            );

            if (!isSupported) {
                return res.status(400).json({
                    error: `Unsupported file type: ${file.originalname}`
                });
            }

            const text = await extractText(file);

            if (!text.trim()) {
                return res.status(400).json({
                    error: `${file.originalname} contains no readable text.`
                });
            }

            newDocuments.push({
                name: file.originalname,
                text: text
            });
        }

        const chunksAdded = await addDocumentsToStore(newDocuments);

        uploadedDocuments.push(...newDocuments);

        res.json({
            message: "Documents uploaded and indexed successfully.",
            documents: newDocuments.map(doc => doc.name),
            chunks: chunksAdded
        });
    } catch (error) {
        console.error("Document upload error:", error);

        res.status(500).json({
            error: "Could not read the document. Please check the file and try again."
        });
    }
});

const chatModel = new ChatOllama({
    model: "qwen2.5:3b",
    baseUrl: "http://localhost:11434",
    temperature: 0
});

app.post("/api/chat", async (req, res) => {
    try {
        const question =
            typeof req.body.question === "string"
                ? req.body.question.trim()
                : "";

        if (!question) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        if (uploadedDocuments.length === 0) {
            return res.status(400).json({
                error: "Please upload a document before asking questions."
            });
        }

        if (/\b(how many words|word count|number of words)\b/i.test(question)) {
            const counts = uploadedDocuments.map(doc => {
                const words = doc.text.trim()
                    ? doc.text.trim().split(/\s+/).length
                    : 0;

                return `${doc.name}: ${words} words`;
            });

            const totalWords = uploadedDocuments.reduce((total, doc) => {
                const words = doc.text.trim()
                    ? doc.text.trim().split(/\s+/).length
                    : 0;

                return total + words;
            }, 0);

            return res.json({
                answer: `${counts.join("\n")}\nTotal: ${totalWords} words.`,
                sources: uploadedDocuments.map(doc => doc.name)
            });
        }

        const chunksByDocument = await Promise.all(
            uploadedDocuments.map(async doc => {
                const chunks = await searchDocuments(question, doc.name);

                return {
                    name: doc.name,
                    chunks: chunks
                };
            })
        );

        const relevantChunks = chunksByDocument.flatMap(group =>
            group.chunks.map(chunk => ({
                ...chunk,
                metadata: {
                    ...chunk.metadata,
                    source: group.name
                }
            }))
        );

        if (relevantChunks.length === 0) {
            return res.json({
                answer: "I couldn't find that information in your uploaded documents.",
                sources: []
            });
        }

        const context = relevantChunks
            .map(doc =>
                `Source document: ${doc.metadata.source}\nDocument text:\n${doc.pageContent}`
            )
            .join("\n\n");

        const response = await chatModel.invoke([
            {
                role: "system",
                content: `You are a helpful AI assistant that answers questions about uploaded documents.

Use the provided document sections as your source of information.
Answer the user's actual question, even when it is phrased differently from the document.
For summaries, explanations, lists, and comparisons, use the relevant information in the provided sections.
Do not invent facts or use outside knowledge to answer questions about the document.
If the sections do not contain enough information to answer, clearly say:
"I couldn't find that information in your uploaded documents."
Be accurate, clear, and helpful.
For simple questions, give a direct answer.
For questions asking for a list, include all relevant information found in the text.
When asked which document contains a fact, identify the filename shown next to that text.
Never confuse one document's contents with another document's contents.`
            },
            {
                role: "human",
                content: `Document information:\n${context}\n\nUser question: ${question}`
            }
        ]);

        const answer = typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

        const sources = [
            ...new Set(
                relevantChunks.map(doc => doc.metadata.source)
            )
        ];

        res.json({
            answer,
            sources
        });
    } catch (error) {
        console.error("Chat error:", error);

        res.status(500).json({
            error: "The AI couldn't answer right now. Check that Ollama is running and try again."
        });
    }
});

app.locals.uploadedDocuments = uploadedDocuments;

app.listen(PORT, () => {
    console.log(`AI Chatbot is running at http://localhost:${PORT}`);
});


