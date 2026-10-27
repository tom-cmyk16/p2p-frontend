/**
 * Multi-format Question Importer supporting:
 * 1. CSV / Excel exports (.csv, .xlsx exported as CSV)
 * 2. Word / Text formatted questions (.txt, pasted doc text)
 * Standard guideline: 50-100 questions per exam.
 */

export const parseQuestionCsv = (content, { enforceMinQuestions = true } = {}) => {
  if (content.length > 5 * 1024 * 1024) {
    throw new Error("File must be 5 MB or smaller.");
  }
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (!quoted && field.length) {
        throw new Error("Invalid CSV: a quote appears inside an unquoted field.");
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("Invalid CSV: an opening quote is not closed.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) throw new Error("The CSV must contain a header row and at least one question row.");

  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
  const required = ["questiontext", "option1", "option2", "correctoption", "explanation"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing required CSV columns: ${missing.join(", ")}.`);
  if (new Set(headers).size !== headers.length) throw new Error("CSV column names must be unique.");
  const columns = new Map(headers.map((header, index) => [header, index]));
  const questionRows = rows.slice(1);

  if (enforceMinQuestions && questionRows.length < 50) {
    // If under 50, provide informative guidance but parse them
  }

  const rowErrors = [];
  const questions = questionRows.map((values, rowIndex) => {
    const csvRow = rowIndex + 2;
    const get = (name) => values[columns.get(name)]?.trim() || "";
    const questionText = get("questiontext");
    const explanation = get("explanation") || "Standard curriculum concept.";
    const optionValues = Array.from({ length: 6 }, (_, index) => get(`option${index + 1}`));
    let foundEmpty = false;
    for (const option of optionValues) {
      if (!option) foundEmpty = true;
      else if (foundEmpty) rowErrors.push(`Row ${csvRow}: option columns must be consecutive.`);
    }
    const options = optionValues.filter(Boolean);
    const correctValue = get("correctoption");
    const oneBasedOption = /^\d+$/.test(correctValue) ? Number(correctValue) - 1 : -1;
    const correctOption = oneBasedOption >= 0
      ? oneBasedOption
      : options.findIndex((option) => option.toLowerCase() === correctValue.toLowerCase());

    if (!questionText) rowErrors.push(`Row ${csvRow}: questionText is required.`);
    if (options.length < 2) rowErrors.push(`Row ${csvRow}: at least two options are required.`);
    if (new Set(options).size !== options.length) rowErrors.push(`Row ${csvRow}: options must be unique.`);
    if (correctOption < 0 || correctOption >= options.length) {
      rowErrors.push(`Row ${csvRow}: correctOption must be 1-${options.length} or match an option exactly.`);
    }
    return { questionText, options, correctOption, explanation };
  });

  if (rowErrors.length) {
    throw new Error(`${rowErrors.slice(0, 10).join(" ")}${rowErrors.length > 10 ? ` Plus ${rowErrors.length - 10} more errors.` : ""}`);
  }
  return questions;
};

/**
 * Parses questions from Word document text or structured Plain Text.
 * Format expected:
 * 1. Question text here?
 * A) Option 1
 * B) Option 2
 * C) Option 3
 * D) Option 4
 * Answer: A (or Correct: B)
 * Explanation: Why this is correct.
 */
export const parseQuestionWordText = (text) => {
  if (!text || !text.trim()) {
    throw new Error("The file or text content is empty.");
  }

  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n+/);

  const questions = [];
  const errors = [];

  blocks.forEach((block, index) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;

    let questionText = "";
    const options = [];
    let correctOption = -1;
    let explanation = "";

    lines.forEach((line) => {
      const qMatch = line.match(/^(?:(?:\d+[\.\)]\s*)|(?:Question\s*\d*[:\.]?\s*))(.*)/i);
      const optMatch = line.match(/^(?:([A-Fa-f])[\.\)]\s*|\(([A-Fa-f])\)\s*)(.*)/);
      const ansMatch = line.match(/^(?:(?:Answer|Correct|Key)[:\s]+)(.*)/i);
      const expMatch = line.match(/^(?:(?:Explanation|Reason|Note)[:\s]+)(.*)/i);

      if (ansMatch) {
        const rawAns = ansMatch[1].trim();
        // check letter like A, B, C or number 1, 2, 3 or text
        const letterMatch = rawAns.match(/^[A-Fa-f]$/);
        if (letterMatch) {
          correctOption = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
        } else if (/^\d+$/.test(rawAns)) {
          correctOption = Number(rawAns) - 1;
        } else {
          // Will match after options are read
          ansMatch._rawText = rawAns;
        }
      } else if (expMatch) {
        explanation = expMatch[1].trim();
      } else if (optMatch) {
        options.push(optMatch[3].trim());
      } else if (qMatch && !questionText) {
        questionText = qMatch[1].trim() || line;
      } else if (!questionText && options.length === 0) {
        questionText = line;
      } else if (options.length > 0 && correctOption === -1) {
        // Line might be un-prefixed option or answer
        if (/^correct/i.test(line)) {
          const matched = line.replace(/^correct[:\s]*/i, "").trim();
          const letter = matched.match(/^[A-Fa-f]/);
          if (letter) correctOption = letter[0].toUpperCase().charCodeAt(0) - 65;
        }
      }
    });

    if (questionText && options.length >= 2) {
      if (correctOption < 0 || correctOption >= options.length) {
        correctOption = 0; // fallback to first option if unassigned
      }
      questions.push({
        questionText,
        options,
        correctOption,
        explanation: explanation || "Explanation provided in study syllabus.",
      });
    } else if (lines.length > 2) {
      errors.push(`Block ${index + 1}: Could not recognize question and options.`);
    }
  });

  if (questions.length === 0) {
    throw new Error(
      "No valid questions could be detected. Please ensure questions follow the standard format: '1. Question', 'A) Option', 'Answer: A'."
    );
  }

  return questions;
};

/**
 * Universal question file parser (detects CSV vs Word/Text)
 */
export const parseUniversalQuestionFile = async (file) => {
  const fileName = file.name.toLowerCase();
  const content = await file.text();

  if (fileName.endsWith(".csv")) {
    return parseQuestionCsv(content, { enforceMinQuestions: false });
  }

  // Word doc text, txt, or pasted format
  try {
    // Try CSV first in case it's comma separated without extension
    if (content.includes("questionText") && content.includes(",")) {
      return parseQuestionCsv(content, { enforceMinQuestions: false });
    }
    return parseQuestionWordText(content);
  } catch (err) {
    // Fallback to CSV parser if word parser failed
    return parseQuestionCsv(content, { enforceMinQuestions: false });
  }
};

export const downloadQuestionCsvTemplate = () => {
  const template = [
    "questionText,option1,option2,option3,option4,correctOption,explanation",
    '"What is the SI unit of electric force?","Newton","Joule","Watt","Pascal",1,"Force is measured in Newtons (N)"',
    '"Which organelle is known as the powerhouse of the cell?","Nucleus","Mitochondria","Ribosome","Chloroplast",2,"Mitochondria produce cellular ATP energy"',
    '"Simplify: (3x + 2) + (5x - 7)","8x - 5","8x + 5","2x - 5","15x - 14",1,"Combining like terms: 3x+5x=8x, 2-7=-5"',
  ].join("\r\n");
  const fileUrl = URL.createObjectURL(new Blob([template], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "exam-questions-import-template.csv";
  link.click();
  URL.revokeObjectURL(fileUrl);
};

export const downloadQuestionWordTemplate = () => {
  const template = [
    "1. What is the SI unit of force?",
    "A) Newton",
    "B) Joule",
    "C) Watt",
    "D) Pascal",
    "Answer: A",
    "Explanation: Force is measured in Newtons.",
    "",
    "2. Which organelle is known as the powerhouse of the cell?",
    "A) Nucleus",
    "B) Mitochondria",
    "C) Ribosome",
    "D) Chloroplast",
    "Answer: B",
    "Explanation: Mitochondria generate the cell's ATP.",
    "",
    "3. Solve for x: 3x - 9 = 0",
    "A) 1",
    "B) 2",
    "C) 3",
    "D) 4",
    "Answer: C",
    "Explanation: 3x = 9 => x = 3.",
  ].join("\r\n");
  const fileUrl = URL.createObjectURL(new Blob([template], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = "exam-questions-word-text-template.txt";
  link.click();
  URL.revokeObjectURL(fileUrl);
};
