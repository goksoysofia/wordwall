import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API yapılandırması eksik" },
        { status: 500 }
      );
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase yapılandırması eksik" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt gerekli" },
        { status: 400 }
      );
    }

    // Step 1: Enhance the prompt using Gemini Flash (text-only, very cheap)
    let enhancedPrompt = prompt.trim();
    try {
      const enhanceRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an image prompt enhancer for a children's educational app. Take the user's simple description and enhance it into a detailed image generation prompt. Keep it child-friendly, colorful, and fun.

Rules:
- Output ONLY the enhanced prompt, nothing else
- Keep it under 50 words
- Always specify: flat design, vibrant colors, no text in image, white/clean background
- Make it cartoon/illustration style suitable for children aged 5-12
- Add relevant visual details (colors, expressions, composition)

User's description: "${prompt}"

Enhanced prompt:`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 100,
            },
          }),
        }
      );

      if (enhanceRes.ok) {
        const enhanceData = await enhanceRes.json();
        const enhanced = enhanceData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (enhanced?.trim()) {
          enhancedPrompt = enhanced.trim();
        }
      }
    } catch {
      // If enhancement fails, use original prompt — not critical
    }

    // Step 2: Generate image with enhanced prompt
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancedPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Görsel oluşturulamadı. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();

    // Extract the image from the response
    let imageBase64: string | null = null;
    let mimeType = "image/png";

    const candidates = geminiData.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            break;
          }
        }
      }
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Görsel oluşturulamadı. Farklı bir açıklama deneyin." },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const buffer = Buffer.from(imageBase64, "base64");
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("activity-images")
      .upload(fileName, buffer, { contentType: mimeType });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("activity-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl, enhancedPrompt });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
