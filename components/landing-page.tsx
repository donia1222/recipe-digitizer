"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChefHat,
  Scan,
  Users,
  Shield,
  Brain,
  Archive,
  Heart,
  MessageSquare,
  Smartphone,
  ArrowRight,
  Sparkles,
  Utensils,
  CheckCircle,
  Clock,
  Star,
  Eye,
  Palette,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"

interface LandingPageProps {
  onAccessApp: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onAccessApp }) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: Brain,
      title: "KI-Digitalisierung",
      description: "Fotografieren Sie handgeschriebene Rezepte und lassen Sie unsere KI sie automatisch digitalisieren",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: Users,
      title: "Drei Benutzerrollen",
      description: "Administrator, Mitarbeiter und Gast - jeder mit spezifischen Berechtigungen und Funktionen",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Archive,
      title: "Intelligente Bibliothek",
      description: "Organisieren Sie Rezepte in Ordnern, setzen Sie Favoriten und nutzen Sie die erweiterte Suche",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: MessageSquare,
      title: "Kommentarsystem",
      description: "Bewerten, kommentieren und liken Sie Rezepte mit unserem vollständigen Interaktionssystem",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Shield,
      title: "Rezept-Genehmigung",
      description: "Administratoren prüfen und genehmigen alle Rezepte vor der Veröffentlichung",
      color: "from-red-500 to-pink-600"
    },
    {
      icon: Smartphone,
      title: "PWA-Technologie",
      description: "Installierbar, offline-fähig und funktioniert perfekt auf allen Geräten",
      color: "from-violet-500 to-purple-600"
    }
  ]

  const roles = [
    {
      icon: Shield,
      name: "Administrator",
      description: "Vollzugriff auf Systemverwaltung",
      features: ["Rezepte genehmigen", "Benutzerverwaltung", "Systemstatistiken", "Ausstehende Rezepte"],
      color: "border-red-200 bg-red-50"
    },
    {
      icon: ChefHat,
      name: "Mitarbeiter",
      description: "Erstellen und verwalten von Rezepten",
      features: ["Rezepte erstellen", "Zur Genehmigung senden", "KI-Digitalisierung", "Persönliche Bibliothek"],
      color: "border-green-200 bg-green-50"
    },
    {
      icon: Eye,
      name: "Gast",
      description: "Rezepte ansehen und durchsuchen",
      features: ["Rezepte ansehen", "Bibliothek durchsuchen", "Kommentare lesen", "Rezepte herunterladen"],
      color: "border-blue-200 bg-blue-50"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Powered by Chat GPT</span>
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                Digitale
              </span>
              <br />
              <span className="text-gray-800">Rezeptsammlung</span>
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Die intelligente Lösung für die Digitalisierung und Verwaltung von Rezepten mit
              <span className="font-semibold text-blue-600"> KI-Unterstützung</span> und
              <span className="font-semibold text-cyan-600"> kollaborativen Funktionen</span>
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={onAccessApp}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Utensils className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Zur Anwendung
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Keine Installation erforderlich</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <ChefHat className="h-16 w-16 text-green-500" />
          </motion.div>
        </div>
        <div className="absolute top-32 right-10 opacity-20">
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Scan className="h-20 w-20 text-blue-500" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Leistungsstarke Funktionen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Entdecken Sie alle Möglichkeiten unserer modernen Rezeptverwaltung
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/70 backdrop-blur-sm hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Benutzerrollen & Berechtigungen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Jede Rolle hat spezifische Funktionen für optimale Zusammenarbeit
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {roles.map((role, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`h-full border-2 ${role.color} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center">
                        <role.icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {role.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {role.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {role.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Arbeitsablauf & Qualitätssicherung
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professioneller Workflow mit Qualitätskontrolle für hochwertige Rezeptsammlung
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rezept erstellen</h3>
              <p className="text-gray-600">
                Mitarbeiter erstellen neue Rezepte manuell oder digitalisieren sie mit KI aus Fotos
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Admin-Prüfung</h3>
              <p className="text-gray-600">
                Administratoren prüfen eingereichte Rezepte auf Qualität und Vollständigkeit
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Veröffentlichung</h3>
              <p className="text-gray-600">
                Genehmigte Rezepte werden in der Bibliothek veröffentlicht und für alle verfügbar
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center border border-green-200"
          >
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Qualitätsgarantie</h3>
            <p className="text-gray-600">
              Durch den Genehmigungsprozess stellen wir sicher, dass nur hochwertige,
              vollständige und korrekte Rezepte in die Sammlung aufgenommen werden.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Moderne Technologie
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Entwickelt mit den neuesten Technologien für beste Performance
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Next.js 15", icon: Zap, color: "text-black" },
              { name: "React 19", icon: Palette, color: "text-blue-500" },
              { name: "TypeScript", icon: CheckCircle, color: "text-blue-600" },
              { name: "PWA Ready", icon: Smartphone, color: "text-green-500" }
            ].map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
                  <tech.icon className={`h-8 w-8 ${tech.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{tech.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-blue-500 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Bereit zu starten?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Beginnen Sie noch heute mit der Digitalisierung Ihrer Rezeptsammlung
            </p>

            <Button
              onClick={onAccessApp}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 group"
            >
              <ChefHat className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Jetzt starten
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8 text-blue-100">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="text-sm">Keine Registrierung</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Sofort einsatzbereit</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm">Alle Geräte</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-gray-900 text-gray-400 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="mb-2">
            Digitale Rezeptsammlung • Entwickelt von Lweb Schweiz
          </p>
          <p className="text-sm">
            Powered by Next.js, React & KI-Technologie
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage