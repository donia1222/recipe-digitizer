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
              "Extrahiere das Rezept exakt aus dem Bild. Verwende den EXAKTEN Titel/Namen wie er im Bild steht - übersetze oder ändere ihn NICHT. Gib nur aus: Titel (wie im Bild), Zutaten-Liste, Zubereitungsschritte. Keine Tipps, Erklärungen oder Kommentare. Nur die reine Information.",
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
            content: `Berechne nur die Mengen des Rezepts neu. Gib nur das angepasste Rezept aus ohne Erklärungen, Tipps oder Kommentare. Ändere nur die Mengenangaben, nicht die Zubereitungsschritte. Antwort auf Deutsch.`,
          },
          {
            role: "user",
            content: `Berechne die Mengen für ${newServings} Personen um (original für ${originalServings} Personen):

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
