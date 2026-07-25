import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentText, filename } = body;

    if (!documentText || typeof documentText !== "string") {
      return NextResponse.json(
        { error: "Document text content is required for extraction." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;

    if (!apiKey) {
      // Return structured fallback if API key is unconfigured, strictly obeying non-invention rules
      return NextResponse.json({
        documentType: "unknown",
        documentDate: "not_found",
        issuingProvider: "not_found",
        diagnosedConditions: [],
        medications: [],
        allergies: [],
        restrictionsAndPrecautions: [],
        followUpInstructions: "not_found",
        redFlagNotes: [],
        emergencyNotes: [],
        confidenceScore: 0.0,
        reviewRequired: true,
        warning: "Gemini API key not configured. Document marked for manual human review.",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are a clinical document extraction system.
Analyze the following medical text strictly based ONLY on explicitly stated facts.

NON-NEGOTIABLE EXTRACTION RULES:
1. DO NOT INVENT, ASSUME, OR INFER ANY CLINICAL DATA, DIAGNOSIS, OR MEDICATION.
2. If a field is not explicitly mentioned in the text, return "not_found" or an empty array [].
3. For diagnosedConditions, include ONLY conditions explicitly stated as diagnosed.
4. Set reviewRequired to true. All extracted data must be reviewed by a human clinician before activation.

Return JSON adhering strictly to this schema:
{
  "documentType": "prescription" | "discharge_summary" | "diagnosis_report" | "treatment_note" | "care_plan" | "unknown",
  "documentDate": "YYYY-MM-DD" or "not_found",
  "issuingProvider": "string" or "not_found",
  "diagnosedConditions": [
    {
      "conditionName": "string",
      "status": "active" | "historical" | "suspected",
      "explicitMention": true
    }
  ],
  "medications": [
    {
      "drugName": "string",
      "dosage": "string",
      "frequency": "string"
    }
  ],
  "allergies": ["string"],
  "restrictionsAndPrecautions": ["string"],
  "followUpInstructions": "string" or "not_found",
  "redFlagNotes": ["string"],
  "emergencyNotes": ["string"],
  "confidenceScore": 0.95,
  "reviewRequired": true
}

DOCUMENT TEXT TO EXTRACT:
"""
${documentText}
"""
`;

    const response = await model.generateContent(prompt);
    const textOutput = response.response.text();
    const parsedData = JSON.parse(textOutput);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Medical document extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract structured data from document.",
        details: error?.message || String(error),
        fallback: {
          documentType: "unknown",
          documentDate: "not_found",
          issuingProvider: "not_found",
          diagnosedConditions: [],
          medications: [],
          allergies: [],
          restrictionsAndPrecautions: [],
          followUpInstructions: "not_found",
          redFlagNotes: [],
          emergencyNotes: [],
          confidenceScore: 0.0,
          reviewRequired: true,
        },
      },
      { status: 500 }
    );
  }
}
