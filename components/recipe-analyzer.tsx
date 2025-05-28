import type React from "react"

interface RecipeAnalyzerProps {
  recipe: string
}

const RecipeAnalyzer: React.FC<RecipeAnalyzerProps> = ({ recipe }) => {
  // Split the recipe into sections
  const sections = recipe.split(/\n\n+/)

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        // Check if this section is a header
        const isHeader =
          section.trim().length < 50 &&
          (section.toLowerCase().includes("ingredient") ||
            section.toLowerCase().includes("instruction") ||
            section.toLowerCase().includes("direction") ||
            section.toLowerCase().includes("step") ||
            section.toLowerCase().includes("preparation"))

        // Check if this is an ingredients list
        const isIngredientList = section
          .split("\n")
          .some((line) =>
            /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(line),
          )

        if (isHeader) {
          return (
            <h3
              key={index}
              className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800 pb-2"
            >
              {section}
            </h3>
          )
        } else if (isIngredientList) {
          return (
            <div key={index} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
              {section.split("\n").map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-2 py-1">
                  {!line.trim().startsWith("-") && !line.trim().startsWith("•") && line.trim() !== "" && (
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">{line}</span>
                </div>
              ))}
            </div>
          )
        } else {
          // For instructions, add numbers if they don't already exist
          const lines = section.split("\n").filter((line) => line.trim() !== "")
          const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

          if (isNumberedList || lines.length <= 1) {
            return (
              <p key={index} className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                {section}
              </p>
            )
          } else {
            return (
              <ol key={index} className="list-none pl-0 space-y-4">
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 w-7 h-7 rounded-full flex items-center justify-center font-medium">
                      {lineIndex + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{line}</span>
                  </li>
                ))}
              </ol>
            )
          }
        }
      })}
    </div>
  )
}

export default RecipeAnalyzer
