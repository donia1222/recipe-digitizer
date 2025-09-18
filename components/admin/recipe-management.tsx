"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Eye, Trash2, ChefHat, Calendar, User, Filter, Grid3x3, List, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

interface Recipe {
  id: string
  title: string
  author: string
  date: string
  status: 'approved' | 'pending' | 'rejected'
  image: string
  ingredients: string[]
  instructions: string[]
  servings: number
  cookTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

export default function RecipeManagement() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    // Simular datos de recetas
    setRecipes([
      {
        id: '1',
        title: 'Traditionelle Wiener Schnitzel',
        author: 'Chef Klaus Müller',
        date: '2025-01-18',
        status: 'approved',
        image: '/placeholder.svg',
        ingredients: ['Kalbsschnitzel', 'Mehl', 'Eier', 'Semmelbrösel', 'Butterschmalz', 'Zitrone', 'Salz', 'Pfeffer'],
        instructions: ['Schnitzel flach klopfen', 'In Mehl, Ei und Bröseln wenden', 'In heißem Fett goldbraun backen', 'Mit Zitrone servieren'],
        servings: 4,
        cookTime: '30 min',
        difficulty: 'medium',
        category: 'Hauptgericht'
      },
      {
        id: '2',
        title: 'Bayerische Weißwurst',
        author: 'Anna Schmidt',
        date: '2025-01-17',
        status: 'approved',
        image: '/placeholder.svg',
        ingredients: ['Weißwürste', 'Süßer Senf', 'Brezn', 'Petersilie', 'Zwiebeln'],
        instructions: ['Wasser erhitzen (nicht kochen)', 'Würste 10 Minuten ziehen lassen', 'Mit Senf und Brezn servieren'],
        servings: 2,
        cookTime: '15 min',
        difficulty: 'easy',
        category: 'Vorspeise'
      },
      {
        id: '3',
        title: 'Perfekte Schwarzwälder Kirschtorte',
        author: 'Hans Weber',
        date: '2025-01-16',
        status: 'pending',
        image: '/placeholder.svg',
        ingredients: ['Biskuitböden', 'Kirschen', 'Sahne', 'Kirschbrand', 'Schokolade', 'Zucker'],
        instructions: ['Böden mit Kirschbrand tränken', 'Sahne schlagen', 'Schichten aufbauen', 'Mit Schokolade garnieren'],
        servings: 8,
        cookTime: '60 min',
        difficulty: 'hard',
        category: 'Nachtisch'
      },
      {
        id: '4',
        title: 'Rheinischer Sauerbraten',
        author: 'Greta Fischer',
        date: '2025-01-15',
        status: 'approved',
        image: '/placeholder.svg',
        ingredients: ['Rindfleisch', 'Essig', 'Rotwein', 'Lebkuchen', 'Zwiebeln', 'Möhren', 'Lorbeer'],
        instructions: ['Fleisch 3 Tage einlegen', 'Scharf anbraten', 'Mit Beize ablöschen', 'Langsam schmoren', 'Mit Lebkuchen binden'],
        servings: 6,
        cookTime: '180 min',
        difficulty: 'hard',
        category: 'Hauptgericht'
      }
    ])
  }, [])

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || recipe.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleDeleteRecipe = (id: string) => {
    const recipe = recipes.find(r => r.id === id)
    if (recipe && window.confirm(`Sind Sie sicher, dass Sie das Rezept "${recipe.title}" löschen möchten?`)) {
      setRecipes(recipes.filter(r => r.id !== id))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/3]">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover rounded-t-lg"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={getStatusColor(recipe.status)}>
            {recipe.status === 'approved' && 'Genehmigt'}
            {recipe.status === 'pending' && 'Ausstehend'}
            {recipe.status === 'rejected' && 'Abgelehnt'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
          {recipe.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="h-4 w-4" />
            {recipe.author}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            {recipe.date}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {recipe.difficulty === 'easy' && 'Einfach'}
              {recipe.difficulty === 'medium' && 'Mittel'}
              {recipe.difficulty === 'hard' && 'Schwer'}
            </Badge>
            <span className="text-sm text-gray-500">{recipe.cookTime}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ansehen
              </Button>
            </DialogTrigger>
          </Dialog>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteRecipe(recipe.id)}
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const RecipeListItem = ({ recipe }: { recipe: Recipe }) => (
    <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-lg">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                {recipe.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedRecipe(recipe)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Details ansehen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <User className="h-4 w-4" />
                {recipe.author}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                {recipe.date}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(recipe.status)}>
                {recipe.status === 'approved' && 'Genehmigt'}
                {recipe.status === 'pending' && 'Ausstehend'}
                {recipe.status === 'rejected' && 'Abgelehnt'}
              </Badge>
              <Badge className={getDifficultyColor(recipe.difficulty)}>
                {recipe.difficulty === 'easy' && 'Einfach'}
                {recipe.difficulty === 'medium' && 'Mittel'}
                {recipe.difficulty === 'hard' && 'Schwer'}
              </Badge>
              <span className="text-sm text-gray-500">{recipe.cookTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rezepteverwaltung
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Verwalten Sie alle Rezepte im System
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rezepte suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              >
                <option value="all">Alle Status</option>
                <option value="approved">Genehmigt</option>
                <option value="pending">Ausstehend</option>
                <option value="rejected">Abgelehnt</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-slate-500 to-slate-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-100">Gesamt</p>
                <p className="text-2xl font-bold">{recipes.length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Genehmigt</p>
                <p className="text-2xl font-bold">{recipes.filter(r => r.status === 'approved').length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-100">Ausstehend</p>
                <p className="text-2xl font-bold">{recipes.filter(r => r.status === 'pending').length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Abgelehnt</p>
                <p className="text-2xl font-bold">{recipes.filter(r => r.status === 'rejected').length}</p>
              </div>
              <ChefHat className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de recetas */}
      {filteredRecipes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecipes.map(recipe => (
              <RecipeListItem key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )
      ) : (
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Rezepte gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Versuchen Sie, die Suchfilter zu ändern
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles de receta */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.title}</DialogTitle>
              <DialogDescription>
                Por {selectedRecipe.author} • {selectedRecipe.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                <Image
                  src={selectedRecipe.image}
                  alt={selectedRecipe.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(selectedRecipe.status)}>
                  {selectedRecipe.status === 'approved' && 'Genehmigt'}
                  {selectedRecipe.status === 'pending' && 'Ausstehend'}
                  {selectedRecipe.status === 'rejected' && 'Abgelehnt'}
                </Badge>
                <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                  {selectedRecipe.difficulty === 'easy' && 'Einfach'}
                  {selectedRecipe.difficulty === 'medium' && 'Mittel'}
                  {selectedRecipe.difficulty === 'hard' && 'Schwer'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {selectedRecipe.servings} Portionen • {selectedRecipe.cookTime}
                </span>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Zutaten:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Anweisungen:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}