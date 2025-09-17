export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl flex items-center justify-center mb-8 mx-auto">
          <svg
            className="h-12 w-12 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Sin conexión
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          No hay conexión a internet. Algunas funciones pueden no estar disponibles.
        </p>
      </div>
    </div>
  )
}