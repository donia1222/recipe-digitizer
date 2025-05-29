"use server"

/**
 * Server Actions to handle API requests to external services
 * This avoids CORS issues by making requests from the server
 */
"use server"

export async function analyzeRecipeImage(imageBase64: string) {
  try {
    const response = await fetch("https://foodscan-ai.com/responseImageAnalysis.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein professioneller Koch. Analysiere ein Rezept-Bild und liefere realistische Mengenangaben für 2 Personen. Vermeide Bruchteile von Gemüse. Nutze Gramm/ml für nicht zählbare Zutaten. Antworte auf Deutsch mit einer Liste von Zutaten und klaren Schritten.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`Server responded with ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (data.choices?.[0]?.message?.content) {
      return { success: true, analysis: data.choices[0].message.content }
    } else if (data.analysis) {
      return { success: true, analysis: data.analysis }
    } else if (typeof data === "string") {
      return { success: true, analysis: data }
    } else {
      console.error("Unexpected response format:", data)
      throw new Error("Unexpected response format")
    }
  } catch (error) {
    console.error("Error in server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}


export async function recalculateServings(recipe: string, originalServings: number, newServings: number) {
  try {
    const response = await fetch("https://foodscan-ai.com/responseChat.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
    model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: `You are a professional chef who recalculates recipe quantities accurately. 
            
Important rules:
- Maintain realistic and practical measurements
- For whole vegetables/fruits: use whole numbers when possible (1, 2, 3 onions)
- Only use fractions (1/2, 1/4) when it makes culinary sense or Grams
- For small servings, suggest "1 small onion" instead of "1/2 onion"
- For liquids and powders: scale proportionally (200ml becomes 400ml for double)
- Keep the same format as the original recipe
- Only change ingredient quantities, not the instructions
-Response in German

`,
          },
          {
            role: "user",
            content: `This recipe is currently for ${originalServings} persons. 
            
Please recalculate all ingredient quantities for ${newServings} persons.
Use realistic measurements that a home cook would actually use.

Original recipe:
${recipe}`,
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText)
      throw new Error(`Server responded with ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Extract the recipe text from the OpenAI response format
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return { success: true, analysis: data.choices[0].message.content }
    } else {
      console.error("Unexpected response format:", data)
      throw new Error("Unexpected response format")
    }
  } catch (error) {
    console.error("Error in server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
