
import { GoogleGenAI } from "@google/genai";
import type { UploadedFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const dataRetrieverModel = 'gemini-2.5-flash';
const medicalFacilitatorModel = 'gemini-2.5-flash';

export const retrieveDataFromText = async (documentText: string): Promise<string> => {
    try {
        const prompt = `
        You are a highly efficient Data Retriever Agent for a medical context.
        Your task is to extract, structure, and summarize the key information from the following medical document text.
        Present the output in a clean, easy-to-read format using Markdown. Do not add any conversational text, just the structured data.
        
        Key sections to identify:
        - Patient Information (Name, Age, Gender, etc.)
        - Chief Complaint / Reason for Visit
        - History of Present Illness
        - Past Medical History
        - Lab Results / Vitals
        - Current Medications
        - Diagnosis / Impression
        
        If a section is not present, omit it.
        
        --- MEDICAL DOCUMENT TEXT ---
        ${documentText}
        --- END OF DOCUMENT ---
        `;

        const response = await ai.models.generateContent({
            model: dataRetrieverModel,
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error in data retriever agent:", error);
        throw new Error("Failed to process document text. Please check the console for details.");
    }
};

export const generateFinalReport = async (structuredData: string, imageFile: UploadedFile): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: imageFile.base64,
                mimeType: imageFile.mimeType,
            },
        };

        const textPart = {
            text: `
            You are a sophisticated Medical Facilitator Agent.
            Your role is to synthesize information from a structured medical data report and a medical image (like an X-ray) to generate a comprehensive final report that includes clinical analysis, logistical planning, and patient advocacy.

            **Instructions:**
            1.  Analyze the structured data provided.
            2.  Analyze the provided medical image.
            3.  Integrate findings from both sources into a coherent final report.
            4.  Structure the report with the following sections using Markdown:
                - **## Final Integrated Report**
                - **### Patient Summary** (Briefly summarize the patient case based on the structured data)
                - **### Imaging Analysis** (Describe your findings from the medical image)
                - **### Correlated Diagnosis** (Combine information from both text and image to provide a potential diagnosis or assessment)
                - **### Recommendations** (Suggest next steps, further tests, or initial treatment considerations)
                - **### Treatment Plan Generation** (Outline a potential, more detailed treatment plan. This can include phases, types of therapy, specialist consultations, etc.)
                - **### Travel & Logistics** (Based on the diagnosis and treatment plan, provide considerations for travel, accommodation, and scheduling if specialized care might be required far from home.)
                - **### Patient Advocacy** (Suggest key questions and topics for the patient to discuss with their healthcare provider to ensure they are fully informed and involved in their care decisions.)
            5.  Maintain a professional, clinical, yet supportive tone.

            --- STRUCTURED MEDICAL DATA ---
            ${structuredData}
            --- END OF DATA ---
            `,
        };

        const response = await ai.models.generateContent({
            model: medicalFacilitatorModel,
            contents: { parts: [textPart, imagePart] },
        });
        
        return response.text;

    } catch (error) {
        console.error("Error in medical facilitator agent:", error);
        throw new Error("Failed to generate the final report. The model may have refused the content. Please check the console for details.");
    }
};
