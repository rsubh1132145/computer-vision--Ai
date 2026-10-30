import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

export const RegionSchema = z.object({
  label: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  box_2d: z.array(z.number()).length(4), // [ymin, xmin, ymax, xmax] normalized 0 to 1000
  description: z.string(),
});

export const VisionAnalysisResponseSchema = z.object({
  summary: z.string(),
  confidenceScore: z.number().min(0).max(1),
  anomaliesDetected: z.boolean(),
  regions: z.array(RegionSchema),
  recommendations: z.array(z.string()),
});

export type VisionAnalysisResult = z.infer<typeof VisionAnalysisResponseSchema>;

// Initialize Google GenAI with recommended telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function analyzeVisualPayload(params: {
  imageUrl: string;
  domain: string;
  sensitivity?: 'Low' | 'Medium' | 'High';
  customQuery?: string;
}): Promise<VisionAnalysisResult> {
  const { imageUrl, domain, sensitivity = 'Medium', customQuery = '' } = params;

  let mimeType = 'image/jpeg';
  let base64Data = '';

  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      throw new Error('Malformed data URL format.');
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Fetch remote image buffer securely on server
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Failed to retrieve image from provided URL: ${imgRes.statusText}`);
    }
    const contentType = imgRes.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      mimeType = contentType;
    }
    const buffer = await imgRes.arrayBuffer();
    base64Data = Buffer.from(buffer).toString('base64');
  } else {
    // Treat as raw base64 string
    base64Data = imageUrl;
  }

  const sensitivityGuidance = {
    Low: 'Low sensitivity: Flag only glaring defects or severe out-of-spec structural deviations. Do not flag trivial cosmetic variations.',
    Medium: 'Balanced sensitivity: Standard operational quality assurance. Detect noticeable defects, irregularities, or anomalies.',
    High: 'High sensitivity: Strict zero-tolerance inspection. Identify hairline cracks, subtle micro-defects, mild asymmetry, or tiny edge variations.',
  }[sensitivity];

  const domainPrompts: Record<string, string> = {
    industrial: `Domain: Industrial Manufacturing & Automated Quality Control (AOI).
Focus areas:
- Surface defects, scratch patterns, fissures, micro-fractures, voids.
- Solder bridge flaws, missing SMD electronics components, cold joints, misaligned pins.
- Welding bead continuity, porosity, undercut, burn-through.
- Dimensional tolerance, assembly placement, edge alignment.`,

    medical: `Domain: Medical & Clinical Screening Assistance.
Focus areas:
- Radiological opacities, consolidations, nodules, pleural effusions in X-rays/scans.
- Dermatological lesion borders, asymmetry, pigment irregularities, diameter.
- Cellular clustering, tissue density variations, structural alignment.
- Always provide objective observational features suitable for clinical review.`,

    document: `Domain: Document & Scanned Text Intelligence.
Focus areas:
- OCR parsing: Invoice line items, net totals, tax IDs, invoice numbers, dates.
- Form fields: Checkboxes, signature verification presence, missing mandatory fields.
- Structural layout integrity, table segmentation, tamper marks, skewed alignment.`,

    general: `Domain: General Visual Intelligence & Safety.
Focus areas:
- Occupational Safety & Health (OSHA): Hardhats, high-visibility vests, eye protection (PPE compliance).
- Workplace hazard localization: Spills, tripping hazards, blocked emergency exits, equipment obstructions.
- Inventory enumeration: Counting boxes, pallets, products, or units with exact bounding boxes.`,
  };

  const domainInstruction = domainPrompts[domain] || domainPrompts['general'];

  const promptText = `
Analyze this visual data for the domain: ${domain.toUpperCase()}.
${domainInstruction}

Operational Sensitivity Setting:
${sensitivityGuidance}

${customQuery ? `Specific Operator Query / Focus Area:\n"${customQuery}"\n` : ''}

CRITICAL BOUNDING BOX RULES:
1. Identify all key objects, anomalies, defective regions, or critical points of interest.
2. For each region in the "regions" array, compute a normalized bounding box "box_2d" with exactly 4 numbers: [ymin, xmin, ymax, xmax].
3. The values MUST be integers or numbers normalized strictly from 0 to 1000, where [0, 0, 1000, 1000] corresponds to [top, left, bottom, right] of the full image.
4. If no anomalies exist, "anomaliesDetected" must be false, and "regions" can mark notable normal objects or be empty.
5. Provide actionable, concise operational recommendations in "recommendations".
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction:
          'You are an expert Computer Vision Intelligence Engine. Your task is to analyze the provided visual payload with extreme precision according to the requested domain. Return only valid JSON conforming strictly to the requested schema. Provide accurate bounding regions normalized between 0 and 1000 [ymin, xmin, ymax, xmax], objective confidence scores, and actionable operational insights to resolve manual inspection bottlenecks.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Overall operational assessment of the visual payload.',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Model confidence score between 0.00 and 1.00.',
            },
            anomaliesDetected: {
              type: Type.BOOLEAN,
              description: 'True if any defects, flaws, or anomalies were detected.',
            },
            regions: {
              type: Type.ARRAY,
              description: 'Array of detected regions and bounding boxes.',
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: 'Descriptive title of the detected region or defect.',
                  },
                  severity: {
                    type: Type.STRING,
                    enum: ['Low', 'Medium', 'High', 'Critical'],
                    description: 'Severity classification of the anomaly.',
                  },
                  box_2d: {
                    type: Type.ARRAY,
                    description: 'Normalized bounding box [ymin, xmin, ymax, xmax] from 0 to 1000.',
                    items: {
                      type: Type.NUMBER,
                    },
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Technical explanation of what was detected in this bounding region.',
                  },
                },
                required: ['label', 'severity', 'box_2d', 'description'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Actionable operational procedures, rework suggestions, or follow-ups.',
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ['summary', 'confidenceScore', 'anomaliesDetected', 'regions', 'recommendations'],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseError) {
      // If wrapped in markdown json block
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Validate strictly with Zod
    const validated = VisionAnalysisResponseSchema.parse(parsed);

    // Normalize any coordinates that might exceed bounds
    validated.regions = validated.regions.map(r => ({
      ...r,
      box_2d: [
        Math.max(0, Math.min(1000, Math.round(r.box_2d[0]))),
        Math.max(0, Math.min(1000, Math.round(r.box_2d[1]))),
        Math.max(0, Math.min(1000, Math.round(r.box_2d[2]))),
        Math.max(0, Math.min(1000, Math.round(r.box_2d[3]))),
      ] as [number, number, number, number],
    }));

    return validated;
  } catch (error: any) {
    console.error('Vision analysis execution error:', error);
    throw new Error(`Visual intelligence engine failed: ${error.message || error}`);
  }
}
