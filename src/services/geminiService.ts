import { GoogleGenAI } from "@google/genai";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function getNextStepSuggestion(clientData: any) {
  const prompt = `
    Te egy profi CRM tanácsadó vagy. Itt egy ügyfél adatai és előzményei:
    Ügyfél: ${clientData.name} (${clientData.company || 'Nincs megadva'})
    Aktuális ajánlatok: ${JSON.stringify(clientData.deals)}
    Utolsó interakciók: ${JSON.stringify(clientData.interactions)}
    Feladatok: ${JSON.stringify(clientData.tasks)}

    Kérlek adj egy rövid (max 2-3 mondat), konkrét javaslatot a következő lépésre, hogy közelebb kerüljünk az üzletkötéshez vagy az ügyfél elégedettségéhez.
    Válaszolj magyarul.
  `;

  try {
    const ai = getAI();
    if (!ai) return "AI nem elérhető (nincs API kulcs beállítva).";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Nem sikerült AI javaslatot generálni.";
  }
}

export async function generateEmailDraft(clientData: any, userIntent: string) {
  const prompt = `
    Te egy profi CRM értékesítő vagy. Írj egy professzionális, meggyőző, de barátságos e-mailt az alábbi ügyfélnek.
    Ügyfél neve: ${clientData.name}
    Cég: ${clientData.company || 'Nincs megadva'}
    Előzmények: ${JSON.stringify(clientData.interactions.slice(0, 3))}
    Aktuális ajánlatok: ${JSON.stringify(clientData.deals)}
    
    A levél célja: ${userIntent}
    
    A levél legyen magyar nyelvű, tartalmazzon tárgyat és törzset is. 
    Formátum:
    Tárgy: [Tárgy]
    ---
    [Levél törzse]
  `;

  try {
    const ai = getAI();
    if (!ai) return "AI nem elérhető (nincs API kulcs beállítva).";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Hiba történt a levél generálása közben.";
  }
}
