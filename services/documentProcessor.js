
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractText(file) {
    const fileName = file.originalname.toLowerCase();
    const fileBuffer = file.buffer;

    if (fileName.endsWith(".pdf")) {
        const result = await pdfParse(fileBuffer);
        return result.text;
    }

    if (fileName.endsWith(".txt")) {
        return fileBuffer.toString("utf-8");
    }

    if (fileName.endsWith(".docx")) {
        const result = await mammoth.extractRawText({
            buffer: fileBuffer
        });

        return result.value;
    }

    if (fileName.endsWith(".csv")) {
        return fileBuffer.toString("utf-8");
    }

    throw new Error("Unsupported file type.");
}

module.exports = { extractText };
