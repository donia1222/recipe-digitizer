"use server"

export async function analyzeRecipeImage(imageBase64: string) {
  try {
    const response = await fetch(process.env.FOODSCAN_ANALYZE_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional chef who provides accurate and realistic recipe measurements. Always use practical quantities that make sense in a real kitchen.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this recipe image and extract the full recipe including ingredients with REALISTIC measurements and instructions. 

Important rules:
- Standardize the recipe for 2 persons
- Use realistic and practical quantities (e.g., 1 onion, 2 carrots, 200g flour)
- Avoid fractions like 3/4 of a vegetable when possible
- Use whole numbers for countable items (1 onion, 2 potatoes, etc.)
- Use weight (grams) or volume (ml, cups) for non-countable items
- Format it nicely with clear sections for ingredients and steps`,
              },
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
    const response = await fetch(process.env.FOODSCAN_RECALCULATE_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a professional chef who recalculates recipe quantities accurately. 

Important rules:
- Maintain realistic and practical measurements
- For whole vegetables/fruits: use whole numbers when possible (1, 2, 3 onions)
- Only use fractions (1/2, 1/4) when it makes culinary sense
- For small servings, suggest "1 small onion" instead of "1/2 onion"
- For liquids and powders: scale proportionally (200ml becomes 400ml for double)
- Keep the same format as the original recipe
- Only change ingredient quantities, not the instructions`,
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

    if (data.choices?.[0]?.message?.content) {
      return { success: true, analysis: data.choices[0].message.content }
    } else {
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
