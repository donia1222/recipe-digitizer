import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Digitalizador de Recetas',
  description: 'Digitaliza y organiza tus recetas con IA',
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1',
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="overflow-x-hidden">{children}</body>
    </html>
  )
}
