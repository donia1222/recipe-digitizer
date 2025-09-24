"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RecipeService } from "@/lib/services/recipeService"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Folder,
  FolderPlus,
  Check,
  X,
  Star,
  Calendar,
  ChefHat,
  ArrowLeft,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Search,
  Users,
  Grid3x3,
  List,
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface RecipeFolder {
  id: string
  name: string
  color: string
  createdAt: string
  parentId?: string
  isSubcategory?: boolean
}

interface HistoryItem {
  id: number
  recipeId?: string
  image: string
  analysis: string
  date: string
  folderId?: string
  title?: string
  isFavorite?: boolean
  user_id?: string
}

interface RecipeArchivePageProps {
  onSelectRecipe: (item: HistoryItem) => void
  onBack: () => void
  initialSearchFilter?: string
  userRole?: 'admin' | 'worker' | 'guest' | null
  currentUserId?: string
}

const RecipeArchivePage: React.FC<RecipeArchivePageProps> = ({ onSelectRecipe, onBack, initialSearchFilter, userRole, currentUserId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [allRecipes, setAllRecipes] = useState<HistoryItem[]>([])
  const [recipeCounts, setRecipeCounts] = useState<{[key: string]: number}>({})
  const [totalRecipesFromAPI, setTotalRecipesFromAPI] = useState<number>(0)
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingSubcategoryFor, setCreatingSubcategoryFor] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [searchQuery, setSearchQuery] = useState(initialSearchFilter || "")
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)
  const [availableUsers, setAvailableUsers] = useState<{id: string, name: string}[]>([])
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreRecipes, setHasMoreRecipes] = useState(true)
  const [isLoadingCategoryRecipes, setIsLoadingCategoryRecipes] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<HistoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string, isSubcategory?: boolean} | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(() => {
    // Check if it's a small screen (mobile/tablet)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280 // xl breakpoint
    }
    return true // Default to collapsed on SSR
  })
  const RECIPES_PER_PAGE = 6

  const folderColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]

  // Handle view mode change with scroll position preservation
  const handleViewModeChange = (newMode: 'cards' | 'list') => {
    // Save current scroll position
    const currentScrollPos = window.pageYOffset || document.documentElement.scrollTop
    setScrollPosition(currentScrollPos)

    // Change view mode
    setViewMode(newMode)

    // Restore scroll position after a short delay to allow layout change
    setTimeout(() => {
      window.scrollTo({
        top: currentScrollPos,
        behavior: 'smooth'
      })
    }, 100)
  }

  // Load available users who have created recipes
  const loadAvailableUsers = async () => {
    try {
      console.log('👥 Loading available users who created recipes...');

      // First, get all users from the API
      const usersResponse = await fetch('https://web.lweb.ch/recipedigitalizer/apis/users.php');
      const usersData = await usersResponse.json();

      // Then get all recipes to find which users have created recipes
      const recipesResponse = await fetch('https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?page=1&limit=1000');
      const recipesData = await recipesResponse.json();

      if (usersData.success && recipesData.success && recipesData.data) {
        // Create a map of all users
        const allUsers = new Map();
        if (usersData.data && Array.isArray(usersData.data)) {
          usersData.data.forEach((user: any) => {
            allUsers.set(user.id, user.name);
          });
        }

        // Get unique user IDs from recipes
        const uniqueUserIds = [...new Set(
          recipesData.data
            .map((recipe: any) => recipe.user_id)
            .filter((userId: string) => userId && userId.trim())
        )];

        console.log('👥 Unique user IDs in recipes:', uniqueUserIds);
        console.log('👥 All users in database:', Array.from(allUsers.keys()));

        // Create list of users who have created recipes
        const usersList = (uniqueUserIds as string[])
          .map((userId: string) => ({
            id: userId,
            name: allUsers.get(userId) || userId
          }))
          .filter((user: { id: string; name: string }) => user.name !== user.id); // Only include users with real names

        setAvailableUsers(usersList);
        console.log('👥 Final users list with recipes:', usersList);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  }

  // Load first page of recipes from database with pagination
  const loadData = async (reset = false) => {
    try {
      const pageToLoad = reset ? 1 : currentPage;

      console.log(`📚 Cargando recetas (página ${pageToLoad})...`);

      // Make request with pagination parameters
      const url = `https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?page=${pageToLoad}&limit=${RECIPES_PER_PAGE}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        console.log(`📚 Recetas cargadas página ${pageToLoad}:`, data.data.length);
        console.log('📝 Metadata:', data.pagination);

        // Sync data format
        const syncedRecipes = data.data.map((recipe: any) => {
          let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

          if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
            const firstAdditionalImage = recipe.additional_images[0];
            mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
          }

          return {
            ...recipe,
            folderId: recipe.category_id || recipe.folderId,
            image: mainImage,
            title: recipe.title || recipe.name,
            date: recipe.created_at || recipe.date,
            recipeId: recipe.recipe_id || recipe.recipeId,
            isFavorite: recipe.is_favorite || recipe.isFavorite || false
          };
        });

        if (reset || pageToLoad === 1) {
          setHistory(syncedRecipes);
        } else {
          setHistory(prev => [...prev, ...syncedRecipes]);
        }

        // Update pagination state
        setHasMoreRecipes(data.pagination?.hasMore || false);
        if (reset) {
          setCurrentPage(1);
        }

        // Load actual favorites status for current user
        loadUserFavorites();

        // IMPORTANTE: Usar el total del API inmediatamente
        if (data.pagination?.total) {
          console.log(`📊 Total recetas desde API pagination: ${data.pagination.total}`);
          setTotalRecipesFromAPI(data.pagination.total);
          setRecipeCounts(prev => ({
            ...prev,
            'all': data.pagination.total
          }));
        }

      } else {
        console.error('Error en respuesta de recetas:', data);
        if (reset || currentPage === 1) {
          setHistory([]);
        }
      }

    } catch (error) {
      console.error('Error cargando recetas:', error);
      if (reset || currentPage === 1) {
        setHistory([]);
      }
    }
  };

  // Load all recipes and calculate category counts immediately
  const loadRecipeCounts = async () => {
    try {
      console.log('📊 Cargando conteos de recetas...');

      // Get ALL recipes from API (without pagination) for counts
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?page=1&limit=1000');
      const data = await response.json();

      console.log('📊 API response for counts:', data);

      if (data.success && data.data) {
        const allRecipesData = data.data;
        console.log(`📊 Total recipes from API: ${allRecipesData.length}`);

        // Calculate counts immediately
        const counts: {[key: string]: number} = {
          'all': allRecipesData.length,
          'favorites': allRecipesData.filter((r: any) => r.is_favorite || r.isFavorite).length
        };

        // Calculate category counts
        folders.forEach(folder => {
          const subfolderIds = getAllSubfolderIds(folder.id);
          const count = subfolderIds.reduce((total, categoryId) => {
            return total + allRecipesData.filter((r: any) =>
              (r.category_id === categoryId) || (r.folderId === categoryId)
            ).length;
          }, 0);
          counts[folder.id] = count;
          console.log(`📊 Category "${folder.name}" (${folder.id}) has ${count} recipes`);
        });

        console.log('📊 Final counts:', counts);
        setRecipeCounts(counts);

        // Also save allRecipes for search
        const syncedAllRecipes = allRecipesData.map((recipe: any) => ({
          ...recipe,
          folderId: recipe.category_id || recipe.folderId,
          image: recipe.image_base64 || recipe.image_url || recipe.image,
          title: recipe.title || recipe.name,
          date: recipe.created_at || recipe.date,
          recipeId: recipe.recipe_id || recipe.recipeId,
          isFavorite: recipe.is_favorite || recipe.isFavorite
        }));
        setAllRecipes(syncedAllRecipes);

      } else {
        console.error('❌ Error en respuesta de recetas:', data);
      }

    } catch (error) {
      console.error('❌ Error cargando conteos:', error);
    }
  };

  // Load categories from database and sync with localStorage
  const loadCategories = async () => {
    try {
      console.log('📁 Cargando categorías desde la BD...');
      // Agregar timestamp para evitar caché
      const timestamp = Date.now();
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?_t=${timestamp}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📁 Response data:', data);

      if (data.success && data.data) {
        console.log('📁 Categorías desde BD:', data.data);

        // Convertir formato de BD a formato del frontend
        const dbCategories = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          createdAt: cat.created_at,
          parentId: cat.parent_id,
          isSubcategory: !!cat.parent_id
        }));

        console.log('📁 Categorías convertidas para frontend:', dbCategories);

        // Debug subcategorías específicamente
        const subcategorias = dbCategories.filter((cat: any) => cat.parentId);
        console.log('🔍 SUBCATEGORÍAS DETECTADAS:', subcategorias);
        subcategorias.forEach((sub: any) => {
          console.log(`   📂 "${sub.name}" es hija de "${sub.parentId}"`);
        });

        const categoriasPrincipales = dbCategories.filter((cat: any) => !cat.parentId);
        console.log('🔍 CATEGORÍAS PRINCIPALES:', categoriasPrincipales);
        console.log('📁 Current folders state before update:', folders);

        setFolders(dbCategories);

        // INMEDIATAMENTE después de cargar categorías, calcular conteos
        console.log('🚀 Categorías cargadas, calculando conteos inmediatamente...');
        setTimeout(() => loadRecipeCounts(), 100);

        // Solo guardar en localStorage si hay espacio (opcional)
        try {
          localStorage.setItem("recipeFolders", JSON.stringify(dbCategories));
          console.log('📁 Categorías guardadas en localStorage como backup');
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping categories backup');
        }

        // Log después del setState para verificar (esto no es el problema real)
        setTimeout(() => {
          console.log('📁 Folders state after setState (esto es stale, ignóralo):', folders);
        }, 100);
      } else {
        console.error('❌ Error en response de categorías:', data);
      }
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
      console.error('❌ Detalles del error:', error instanceof Error ? error.message : 'Unknown error');

      // Fallback a localStorage si hay error
      try {
        const savedFolders = localStorage.getItem("recipeFolders")
        if (savedFolders) {
          console.log('📁 Usando categorías desde localStorage como fallback');
          setFolders(JSON.parse(savedFolders))
          return; // Exit early if localStorage worked
        }
      } catch (storageError) {
        console.warn('⚠️ localStorage no disponible para fallback');
      }

      // Si no hay localStorage o falló, usar categorías por defecto
      {
        // Si no hay localStorage, usar categorías por defecto
        console.log('📁 Usando categorías por defecto');
        const defaultCategories = [
          {
            id: 'cat-appetizers',
            name: 'Aperitivos',
            color: '#ef4444',
            createdAt: new Date().toISOString(),
            parentId: undefined,
            isSubcategory: false
          },
          {
            id: 'cat-main',
            name: 'Platos Principales',
            color: '#22c55e',
            createdAt: new Date().toISOString(),
            parentId: undefined,
            isSubcategory: false
          },
          {
            id: 'cat-desserts',
            name: 'Postres',
            color: '#8b5cf6',
            createdAt: new Date().toISOString(),
            parentId: undefined,
            isSubcategory: false
          },
          {
            id: 'cat-beverages',
            name: 'Bebidas',
            color: '#06b6d4',
            createdAt: new Date().toISOString(),
            parentId: undefined,
            isSubcategory: false
          }
        ];
        setFolders(defaultCategories);

        try {
          localStorage.setItem("recipeFolders", JSON.stringify(defaultCategories));
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping default categories backup');
        }
      }
    }
  };

  useEffect(() => {
    loadData(true); // Reset to first page
    loadCategories();
    loadAvailableUsers();

    // Handle resize to auto-expand categories on large screens
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsCategoriesCollapsed(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load counts after folders are loaded AND immediately after first recipe load
  useEffect(() => {
    if (folders.length > 0 && totalRecipesFromAPI > 0) {
      console.log('🚀 Loading recipe counts with folders loaded and total known');
      loadRecipeCounts();
    }
  }, [folders, totalRecipesFromAPI])

  // Debug: Monitor folders and recipes state changes
  useEffect(() => {
    console.log('📁 FOLDERS STATE CHANGED:', folders.length, folders.map(f => f.name));
  }, [folders])

  useEffect(() => {
    console.log('📊 ALL RECIPES STATE CHANGED:', allRecipes.length);
    if (allRecipes.length > 0) {
      console.log('📊 Sample recipes with folderIds:', allRecipes.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title,
        folderId: r.folderId
      })));
    }
  }, [allRecipes])

  // Escuchar eventos de actualización y eliminación de recetas
  useEffect(() => {
    const handleRecipeUpdate = () => {
      console.log('📚 Recipe updated event received in archive, reloading data from database...');
      loadData(true); // Reset and reload from first page
      loadRecipeCounts();
    };

    const handleRecipeDelete = () => {
      console.log('📚 Recipe deleted event received in archive, reloading data...');
      loadData(true); // Reset and reload from first page
      loadRecipeCounts();
    };

    window.addEventListener('recipeUpdated', handleRecipeUpdate);
    window.addEventListener('recipeDeleted', handleRecipeDelete);

    return () => {
      window.removeEventListener('recipeUpdated', handleRecipeUpdate);
      window.removeEventListener('recipeDeleted', handleRecipeDelete);
    };
  }, [])

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      // Obtener usuario actual (puede ser null y está bien)
      const currentUserStr = localStorage.getItem('current-user');
      let currentUserId = null;
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          // Solo asignar si el ID parece válido y no está vacío
          if (currentUser.id && typeof currentUser.id === 'string' && currentUser.id.trim()) {
            currentUserId = currentUser.id.trim();
            console.log('🔍 Using currentUserId for category:', currentUserId);
          }
        } catch (error) {
          console.error('Error parsing current user:', error);
        }
      }

      // Crear categoría en la base de datos
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: folderColors[Math.floor(Math.random() * folderColors.length)],
          parent_id: creatingSubcategoryFor || null,
          user_id: null, // Temporalmente null para evitar foreign key error
          display_order: folders.length + 1
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Categoría creada en BD:', data);

        // Recargar categorías desde la BD para obtener la nueva
        console.log('🔄 Recargando categorías después de crear...');
        await loadCategories();

        setNewFolderName("")
        setIsCreatingFolder(false)
        setCreatingSubcategoryFor(null)

        // Auto-expand parent folder when creating subcategory
        if (creatingSubcategoryFor) {
          setExpandedFolders((prev) => new Set([...prev, creatingSubcategoryFor]))
        }

        console.log('✅ Nueva categoría agregada al frontend');
      } else {
        console.error('❌ Error creating category:', data.error);
        // Fallback a localStorage si falla la BD
        createFolderLocalStorage();
      }
    } catch (error) {
      console.error('❌ Error creating category:', error);
      // Fallback a localStorage si hay error de red
      createFolderLocalStorage();
    }
  }

  // Función fallback para localStorage
  const createFolderLocalStorage = () => {
    const newFolder: RecipeFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColors[Math.floor(Math.random() * folderColors.length)],
      createdAt: new Date().toISOString(),
      parentId: creatingSubcategoryFor || undefined,
      isSubcategory: !!creatingSubcategoryFor,
    }

    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setNewFolderName("")
    setIsCreatingFolder(false)
    setCreatingSubcategoryFor(null)

    // Auto-expand parent folder when creating subcategory
    if (creatingSubcategoryFor) {
      setExpandedFolders((prev) => new Set([...prev, creatingSubcategoryFor]))
    }
  }

  const createSubcategory = (parentId: string) => {
    setCreatingSubcategoryFor(parentId)
    setIsCreatingFolder(true)
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const editFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      // Update folder in database
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?id=${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() })
      })

      if (response.ok) {
        await response.json();
        console.log('✅ Category updated in database successfully');
        // Reload categories first, then data
        await loadCategories();
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadData(true);
        await loadRecipeCounts();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update category in database:', errorText);
        throw new Error('Failed to update category in database');
      }

      setEditingFolder(null)
      setEditFolderName("")

    } catch (error) {
      console.error('❌ Error updating folder:', error)
      // Fallback to localStorage only if database fails
      const updatedFolders = folders.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
      setFolders(updatedFolders)

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping backup')
        }
      }

      setEditingFolder(null)
      setEditFolderName("")
    }
  }

  // Load user favorites to update isFavorite status
  const loadUserFavorites = async () => {
    try {
      const currentUserStr = localStorage.getItem('current-user')
      if (!currentUserStr) return

      const currentUser = JSON.parse(currentUserStr)
      const userId = currentUser.id

      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/favorites.php?user_id=${userId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const favoriteRecipeIds = result.data.map((fav: any) => fav.id)
        console.log('🌟 User favorites loaded:', favoriteRecipeIds)

        // Update both history and allRecipes with favorite status
        setHistory(prev => prev.map(recipe => ({
          ...recipe,
          isFavorite: favoriteRecipeIds.includes(recipe.id)
        })))

        setAllRecipes(prev => prev.map(recipe => ({
          ...recipe,
          isFavorite: favoriteRecipeIds.includes(recipe.id)
        })))
      }
    } catch (error) {
      console.error('❌ Error loading user favorites:', error)
    }
  }

  // Toggle favorite
  // Toggle favorites filter
  const handleToggleFavoritesFilter = () => {
    setShowFavoritesOnly(!showFavoritesOnly)
    console.log('⭐ Toggling favorites filter:', !showFavoritesOnly)
  }

  const handleToggleFavorite = async (recipe: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const currentUserStr = localStorage.getItem('current-user')
      if (!currentUserStr) {
        console.error('No user logged in')
        return
      }

      const currentUser = JSON.parse(currentUserStr)
      const userId = currentUser.id

      console.log('🌟 Toggle favorite:', { userId, recipeId: recipe.id, currentFavorite: recipe.isFavorite })
      console.log('🔍 Current user data:', currentUser)

      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/favorites.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          recipe_id: recipe.id
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('🔄 Updating local state with isFavorite:', result.is_favorite)

        // Update local state
        setHistory(prev => {
          const updated = prev.map(item =>
            item.id === recipe.id
              ? { ...item, isFavorite: result.is_favorite }
              : item
          )
          console.log('📚 Updated history for recipe', recipe.id, ':', updated.find(i => i.id === recipe.id)?.isFavorite)
          return updated
        })

        setAllRecipes(prev => {
          const updated = prev.map(item =>
            item.id === recipe.id
              ? { ...item, isFavorite: result.is_favorite }
              : item
          )
          console.log('📚 Updated allRecipes for recipe', recipe.id, ':', updated.find(i => i.id === recipe.id)?.isFavorite)
          return updated
        })

        // Refresh recipe counts
        loadRecipeCounts()

        console.log('✅ Favorite toggled:', result.message)
      } else {
        console.error('❌ Error toggling favorite:', result.error)
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
    }
  }

  // Confirm delete category
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return

    setIsDeletingCategory(true)

    try {
      // First, move all recipes from this folder and its subcategories to uncategorized
      const allSubfolderIds = getAllSubfolderIds(categoryToDelete.id)

      // Update recipes in database to remove category_id
      for (const subfolderId of allSubfolderIds) {
        const recipesToUpdate = history.filter(item => item.folderId === subfolderId)
        for (const recipe of recipesToUpdate) {
          try {
            await RecipeService.update(recipe.id, { folderId: undefined })
            console.log(`✅ Recipe ${recipe.id} moved to uncategorized`)
          } catch (error) {
            console.error(`❌ Error updating recipe ${recipe.id}:`, error)
          }
        }
      }

      // Delete folder from database
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?id=${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        await response.json();
        console.log('✅ Category deleted from database successfully');
        // Reload categories first, then data
        await loadCategories();
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadData(true);
        await loadRecipeCounts();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete category from database:', errorText);
        throw new Error('Failed to delete category from database');
      }

      // Reset selected folder if it was deleted
      if (allSubfolderIds.includes(selectedFolder || "")) {
        setSelectedFolder(undefined)
      }

      // Close modal
      setDeleteCategoryModalOpen(false)
      setCategoryToDelete(null)

      console.log('✅ Category deleted successfully')

    } catch (error) {
      console.error('❌ Error deleting folder:', error)
      // Fallback to localStorage only if database fails
      const allSubfolderIds = getAllSubfolderIds(categoryToDelete.id)
      const updatedHistory = history.map((item) =>
        allSubfolderIds.includes(item.folderId || "") ? { ...item, folderId: undefined } : item,
      )
      setHistory(updatedHistory)

      const updatedFolders = folders.filter((f) => !allSubfolderIds.includes(f.id))
      setFolders(updatedFolders)

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
          localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping backup')
        }
      }
    } finally {
      setIsDeletingCategory(false)
    }
  }

  const toggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      // Update in database
      const recipe = history.find(item => item.id === id)
      if (recipe) {
        await RecipeService.update(id, { isFavorite: !recipe.isFavorite })
        console.log('✅ Favorite status updated in database')
      }

      // Update local state
      const updatedHistory = history.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
      setHistory(updatedHistory)

      // Update localStorage as backup only
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping favorite backup')
        }
      }

    } catch (error) {
      console.error('❌ Error updating favorite:', error)
      // Fallback to local only if database fails
      const updatedHistory = history.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
      setHistory(updatedHistory)
    }
  }

  const moveToFolder = async (recipeId: number, categoryId: string | undefined) => {
    try {
      console.log('📁 Moviendo receta a categoría:', { recipeId, categoryId });

      // Buscar el ID numérico de la base de datos para esta receta
      const searchResponse = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php`);
      const searchData = await searchResponse.json();

      let numericId = null;
      if (searchData.success && searchData.data) {
        const recipe = searchData.data.find((r: any) => r.id === recipeId);
        if (recipe) {
          numericId = recipe.id;
          console.log('🔍 Found numeric ID for recipe:', { recipeId, numericId });
        }
      }

      if (numericId) {
        // Actualizar en la base de datos
        const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?id=${numericId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category_id: categoryId
          })
        });

        if (response.ok) {
          console.log('✅ Categoría actualizada en BD');

          // Recargar datos desde BD para sincronizar
          await loadData(true);
          await loadRecipeCounts();
        } else {
          console.error('❌ Error updating category in DB');
        }
      } else {
        // Si no encontramos el ID numérico, actualizar solo localmente
        const updatedHistory = history.map((item) => (item.id === recipeId ? { ...item, folderId: categoryId } : item))
        setHistory(updatedHistory)

        // Update localStorage as backup only
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
          } catch (quotaError) {
            console.warn('⚠️ localStorage quota exceeded, skipping move backup')
          }
        }
      }

    } catch (error) {
      console.error('❌ Error moving recipe to category:', error);

      // Fallback a solo localStorage si hay error
      const updatedHistory = history.map((item) => (item.id === recipeId ? { ...item, folderId: categoryId } : item))
      setHistory(updatedHistory)

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
        } catch (quotaError) {
          console.warn('⚠️ localStorage quota exceeded, skipping fallback backup')
        }
      }
    }
  }

  const extractRecipeTitle = (analysis: string) => {
    const lines = analysis.split("\n").filter((line) => line.trim())
    for (const line of lines.slice(0, 5)) {
      if (
        line.length < 60 &&
        !line.toLowerCase().includes("ingredient") &&
        !line.toLowerCase().includes("zutaten") &&
        !line.toLowerCase().includes("instruction") &&
        !line.toLowerCase().includes("schritt") &&
        !line.toLowerCase().includes("portion") &&
        !line.toLowerCase().includes("serving") &&
        !line.toLowerCase().includes("cook") &&
        !line.toLowerCase().includes("prep") &&
        !line.toLowerCase().includes("total") &&
        !line.toLowerCase().includes("difficulty")
      ) {
        return line.trim()
      }
    }
    return "Mein Rezept"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const [userNameCache, setUserNameCache] = useState<{[key: string]: string}>({})

  const getUserName = (userId?: string): string => {
    if (!userId) return 'Unbekannter Benutzer';

    // Check cache first
    if (userNameCache[userId]) {
      return userNameCache[userId];
    }

    // Try to get user name from current user if it matches
    const currentUserStr = localStorage.getItem('current-user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === userId) {
          const name = currentUser.name || 'Sie';
          setUserNameCache(prev => ({ ...prev, [userId]: name }));
          return name;
        }
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    }

    // Fetch from API in background
    fetchUserName(userId);

    return 'Cargando...';
  }

  const fetchUserName = async (userId: string) => {
    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/users.php?id=${userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Check if data.data is an array (all users) or single user
        if (Array.isArray(data.data)) {
          const user = data.data.find((u: any) => u.id === userId);
          if (user && user.name) {
            setUserNameCache(prev => ({ ...prev, [userId]: user.name }));
            return;
          }
        } else if (data.data.name) {
          setUserNameCache(prev => ({ ...prev, [userId]: data.data.name }));
          return;
        }
      }

      // Fallback to static mapping
      const staticMappings: { [key: string]: string } = {
        '1': 'Andrea Müller',
        '2': 'Hans Weber',
        '3': 'Maria Schmidt',
        '4': 'Peter Fischer',
        'admin-001': 'Andrea Müller',
        'worker-001': 'Hans Weber',
        'worker-002': 'Maria Schmidt',
        'guest-001': 'Peter Fischer'
      };
      const fallbackName = staticMappings[userId] || 'Usuario';
      setUserNameCache(prev => ({ ...prev, [userId]: fallbackName }));
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserNameCache(prev => ({ ...prev, [userId]: 'Usuario' }));
    }
  }

  // Check if user can edit a specific recipe (same logic as recipe-analyzer.tsx)
  const canUserEditRecipe = (recipeUserId?: string): boolean => {
    try {
      const role = localStorage.getItem('user-role')
      const currentUserStr = localStorage.getItem('current-user')

      if (!role) return false

      let currentUser = null
      if (currentUserStr) {
        try {
          currentUser = JSON.parse(currentUserStr)
        } catch (error) {
          console.error('Error parsing current user:', error)
          return false
        }
      }

      // Determine if user can edit this recipe
      if (role === 'admin') {
        // Admin can edit any recipe
        return true
      } else if (role === 'worker' && currentUser?.id && recipeUserId) {
        // Worker can only edit their own recipes
        return currentUser.id === recipeUserId
      } else if (role === 'guest') {
        // Guest cannot edit any recipe
        return false
      }

      return false
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  // Handle delete recipe
  const handleDeleteRecipe = (recipe: HistoryItem) => {
    setRecipeToDelete(recipe)
    setDeleteModalOpen(true)
  }

  // Handle delete category/subcategory
  const handleDeleteCategory = (folderId: string, folderName: string, isSubcategory: boolean = false) => {
    setCategoryToDelete({id: folderId, name: folderName, isSubcategory})
    setDeleteCategoryModalOpen(true)
  }

  // Confirm delete recipe
  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete) return

    setIsDeleting(true)
    try {
      // Delete from API
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?id=${recipeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete recipe')
      }

      // Remove from local state
      setHistory(prev => prev.filter(item => item.id !== recipeToDelete.id))
      setAllRecipes(prev => prev.filter(item => item.id !== recipeToDelete.id))

      // Refresh recipe counts
      loadRecipeCounts()

      // Close modal
      setDeleteModalOpen(false)
      setRecipeToDelete(null)

      console.log('✅ Recipe deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting recipe:', error)
      // You could add a toast notification here
    } finally {
      setIsDeleting(false)
    }
  }

  const getSubcategories = (parentId: string) => {
    const subcats = folders.filter((folder) => folder.parentId === parentId);
    // Remove duplicates by name to handle database duplicates
    const uniqueSubcats = subcats.filter((folder, index, arr) =>
      arr.findIndex(f => f.name === folder.name) === index
    );
    console.log(`🔍 getSubcategories("${parentId}"):`, uniqueSubcats.map(s => s.name));
    return uniqueSubcats;
  }

  const getMainCategories = () => {
    return folders.filter((folder) => !folder.parentId)
  }

  const getAllSubfolderIds = (folderId: string): string[] => {
    const subcategories = getSubcategories(folderId)
    const allIds = [folderId]
    subcategories.forEach((sub) => {
      allIds.push(...getAllSubfolderIds(sub.id))
    })
    return allIds
  }

  const filteredHistory =
    selectedFolder === "favorites"
      ? history.filter((item) => item.isFavorite)
      : selectedFolder
        ? history.filter((item) => {
            const allowedIds = getAllSubfolderIds(selectedFolder)
            return allowedIds.includes(item.folderId || "")
          })
        : history // Mostrar TODAS las recetas cuando no hay carpeta seleccionada

  // Apply search filter - Si hay búsqueda, buscar en TODAS las recetas sin importar carpeta
  let searchFilteredHistory = searchQuery
    ? allRecipes.filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        const title = item.title?.toLowerCase() || ""
        const analysis = item.analysis?.toLowerCase() || ""
        return title.includes(searchLower) || analysis.includes(searchLower)
      })
    : filteredHistory

  // Apply user filter
  const userFilteredHistory = selectedUserId
    ? searchFilteredHistory.filter((item) => item.user_id === selectedUserId)
    : searchFilteredHistory

  // Apply favorites filter
  const finalFilteredHistory = showFavoritesOnly
    ? userFilteredHistory.filter((item) => item.isFavorite)
    : userFilteredHistory

  // Load more recipes function
  const loadMoreRecipes = async () => {
    if (isLoadingMore || !hasMoreRecipes) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    try {
      console.log(`📚 Cargando más recetas (página ${nextPage})...`);

      const url = `https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?page=${nextPage}&limit=${RECIPES_PER_PAGE}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        const syncedRecipes = data.data.map((recipe: any) => {
          let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

          if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
            const firstAdditionalImage = recipe.additional_images[0];
            mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
          }

          return {
            ...recipe,
            folderId: recipe.category_id || recipe.folderId,
            image: mainImage,
            title: recipe.title || recipe.name,
            date: recipe.created_at || recipe.date,
            recipeId: recipe.recipe_id || recipe.recipeId
          };
        });

        setHistory(prev => [...prev, ...syncedRecipes]);
        setHasMoreRecipes(data.pagination?.hasMore || false);

        console.log(`✅ Cargadas ${syncedRecipes.length} recetas más`);
      } else {
        setHasMoreRecipes(false);
      }

    } catch (error) {
      console.error('Error cargando más recetas:', error);
      setHasMoreRecipes(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Load recipes for specific category or search
  const loadCategoryOrSearchRecipes = async (categoryId?: string, searchTerm?: string) => {
    if (isLoadingCategoryRecipes) return;

    setIsLoadingCategoryRecipes(true);

    try {
      console.log(`🔍 Cargando recetas para categoría: ${categoryId} o búsqueda: ${searchTerm}`);

      // Get ALL recipes and filter by category or search
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?page=1&limit=1000');
      const data = await response.json();

      if (data.success && data.data) {
        const allRecipesData = data.data.map((recipe: any) => {
          let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

          if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
            const firstAdditionalImage = recipe.additional_images[0];
            mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
          }

          return {
            ...recipe,
            folderId: recipe.category_id || recipe.folderId,
            image: mainImage,
            title: recipe.title || recipe.name,
            date: recipe.created_at || recipe.date,
            recipeId: recipe.recipe_id || recipe.recipeId,
            isFavorite: recipe.is_favorite || recipe.isFavorite
          };
        });

        let filteredRecipes = allRecipesData;

        if (categoryId === "favorites") {
          // Filter by favorites
          filteredRecipes = allRecipesData.filter((recipe: any) => recipe.isFavorite);
          console.log(`🔍 Filtered ${filteredRecipes.length} favorite recipes`);
        } else if (categoryId) {
          // Filter by category
          const allowedIds = getAllSubfolderIds(categoryId);
          filteredRecipes = allRecipesData.filter((recipe: any) =>
            allowedIds.includes(recipe.folderId || "")
          );
          console.log(`🔍 Filtered ${filteredRecipes.length} recipes for category ${categoryId}`);
        } else if (searchTerm) {
          // Filter by search term
          const searchLower = searchTerm.toLowerCase();
          filteredRecipes = allRecipesData.filter((recipe: any) => {
            const title = recipe.title?.toLowerCase() || "";
            const analysis = recipe.analysis?.toLowerCase() || "";
            return title.includes(searchLower) || analysis.includes(searchLower);
          });
          console.log(`🔍 Filtered ${filteredRecipes.length} recipes for search "${searchTerm}"`);
        }

        // Replace current history with filtered results
        setHistory(filteredRecipes);
        setHasMoreRecipes(false); // No pagination for category/search results
        setCurrentPage(1);

      } else {
        console.error('Error loading category/search recipes:', data);
      }

    } catch (error) {
      console.error('Error loading category/search recipes:', error);
    } finally {
      setIsLoadingCategoryRecipes(false);
    }
  };

  const favoriteRecipes = allRecipes.filter((item) => item.isFavorite)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>


              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-gray-500">Recipe Archive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-0">
        <div className="flex flex-col xl:flex-row min-h-screen xl:min-h-[calc(100vh-6rem)]">
          {/* Sidebar - Categories */}
          <div className="w-full xl:w-[28rem] xl:max-w-md bg-white border-r border-gray-200 xl:fixed xl:left-0 xl:top-24 xl:-bottom-10 xl:overflow-y-auto">
            <div className="p-6">
              <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Folder className="h-4 w-4 text-gray-600" />
                  Kategorien
                </h3>
                <button
                  onClick={() => setIsCategoriesCollapsed(!isCategoriesCollapsed)}
                  className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title={isCategoriesCollapsed ? "Kategorien anzeigen" : "Kategorien verbergen"}
                >
                  {isCategoriesCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {!isCategoriesCollapsed && (
                <>
                  {/* All Recipes */}
                  <button
                onClick={() => {
                  setSelectedFolder(undefined);
                  loadData(true); // Reset to paginated view
                }}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 flex items-center gap-3 ${
                  selectedFolder === undefined
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "hover:bg-gray-50 text-gray-700 border border-transparent"
                }`}
              >
                <ChefHat className="h-4 w-4" />
                <span className="font-medium">Alle Rezepte</span>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  {totalRecipesFromAPI || recipeCounts['all'] || allRecipes.length}
                </span>
              </button>


              {/* Folders */}
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <AnimatePresence>
                  {getMainCategories().map((folder) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-2"
                    >
                      {/* Main Category */}
                      <div className="flex items-center">
                        {editingFolder === folder.id ? (
                          <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                            <Input
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              className="flex-1 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  editFolder(folder.id, editFolderName)
                                } else if (e.key === "Escape") {
                                  setEditingFolder(null)
                                  setEditFolderName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => editFolder(folder.id, editFolderName)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFolder(null)
                                setEditFolderName("")
                              }}
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setSelectedFolder(folder.id);
                              loadCategoryOrSearchRecipes(folder.id);
                            }}
                            className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                              selectedFolder === folder.id
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                            }`}
                          >
                            {/* Add Subcategory Button */}
                            {editingFolder !== folder.id && userRole === 'admin' && !isCreatingFolder && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  createSubcategory(folder.id)
                                }}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-100 border border-green-300 hover:border-green-400 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Unterkategorie hinzufügen"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}

                            {/* Expand/Collapse Icon */}
                            {getSubcategories(folder.id).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFolderExpansion(folder.id)
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {expandedFolders.has(folder.id) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            )}

                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                            <span className="flex-1 truncate font-medium">{folder.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                              {recipeCounts[folder.id] || 0}
                            </span>

                            {/* Edit and Delete buttons for main categories */}
                            {userRole === 'admin' && (
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingFolder(folder.id)
                                    setEditFolderName(folder.name)
                                  }}
                                  className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50"
                                >
                                  <Edit3 size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCategory(folder.id, folder.name, false)
                                  }}
                                  className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Subcategories */}
                      <AnimatePresence>
                        {expandedFolders.has(folder.id) &&
                          getSubcategories(folder.id).map((subcategory) => (
                            <motion.div
                              key={subcategory.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-6 mt-1"
                            >
                              {editingFolder === subcategory.id ? (
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: subcategory.color }}
                                  />
                                  <Input
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    className="flex-1 h-7 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        editFolder(subcategory.id, editFolderName)
                                      } else if (e.key === "Escape") {
                                        setEditingFolder(null)
                                        setEditFolderName("")
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => editFolder(subcategory.id, editFolderName)}
                                    className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingFolder(null)
                                      setEditFolderName("")
                                    }}
                                    className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50"
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className={`w-full text-left p-2 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                                    selectedFolder === subcategory.id
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                                  }`}
                                  onClick={() => {
                                    setSelectedFolder(subcategory.id);
                                    loadCategoryOrSearchRecipes(subcategory.id);
                                  }}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: subcategory.color }}
                                  />
                                  <span className="flex-1 truncate text-sm font-medium">{subcategory.name}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {recipeCounts[subcategory.id] || 0}
                                  </span>

                                  {/* Edit and Delete buttons for subcategories */}
                                  {userRole === 'admin' && (
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingFolder(subcategory.id)
                                          setEditFolderName(subcategory.name)
                                        }}
                                        className="h-6 w-6 p-0 border-gray-300 hover:bg-gray-50"
                                      >
                                        <Edit3 size={10} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteCategory(subcategory.id, subcategory.name, true)
                                        }}
                                        className="h-6 w-6 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                      >
                                        <Trash2 size={10} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

                  {/* Create new folder */}
                  {isCreatingFolder ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                  {creatingSubcategoryFor && (
                    <div className="text-xs text-gray-500 mb-2">
                      Subcategory for: {folders.find((f) => f.id === creatingSubcategoryFor)?.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createFolder()
                        if (e.key === "Escape") {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                          setCreatingSubcategoryFor(null)
                        }
                      }}
                      placeholder={creatingSubcategoryFor ? "Subcategory name..." : "Category name..."}
                      className="flex-1 h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button size="sm" onClick={createFolder} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingFolder(false)
                        setNewFolderName("")
                        setCreatingSubcategoryFor(null)
                      }}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : userRole === 'admin' ? (
                <Button
                  onClick={() => setIsCreatingFolder(true)}
                  variant="outline"
                  className="w-full mt-3 border-dashed border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Neue Kategorie
                </Button>
              ) : null}
                </>
              )}
              </div>
            </div>
          </div>

          {/* Main Content - Recipes Grid */}
          <div className="flex-1 xl:ml-[28rem] xl:min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 xl:px-8 pb-0">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedFolder === "favorites"
                    ? "Favoriten"
                    : selectedFolder
                      ? folders.find((f) => f.id === selectedFolder)?.name
                      : "Alle Rezepte"}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {(() => {
                    if (searchQuery) {
                      // If searching, show search results count
                      return `${history.length} Rezepte`;
                    } else if (selectedFolder === "favorites") {
                      // If favorites selected, show favorites count
                      return `${recipeCounts['favorites'] || 0} Rezepte`;
                    } else if (selectedFolder) {
                      // If category selected, show category count
                      return `${recipeCounts[selectedFolder] || 0} Rezepte`;
                    } else {
                      // If "All Recipes" selected, show total or paginated info
                      const total = totalRecipesFromAPI || recipeCounts['all'] || 0;
                      const showing = history.length;
                      if (hasMoreRecipes && !searchQuery) {
                        return `${showing} von ${total} Rezepte`;
                      } else {
                        return `${total} Rezepte`;
                      }
                    }
                  })()}
                </span>
              </div>

              {/* Search Bar and Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Suche nach Rezepttitel oder Inhalt..."
                    value={searchQuery}
                    onChange={(e) => {
                      const newSearchQuery = e.target.value;
                      setSearchQuery(newSearchQuery);

                      if (newSearchQuery.trim()) {
                        // If searching, load all matching recipes
                        setSelectedFolder(undefined); // Clear category selection
                        loadCategoryOrSearchRecipes(undefined, newSearchQuery.trim());
                      } else {
                        // If search cleared, reload paginated view
                        loadData(true);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedFolder(undefined);
                        loadData(true); // Reset to paginated view
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* User Filter Dropdown */}
                <div className="relative min-w-[200px]">
                  <div className="relative">
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) => setSelectedUserId(e.target.value || undefined)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer appearance-none ${
                        selectedUserId
                          ? "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700"
                          : "border-gray-300 bg-gradient-to-r from-white to-gray-50 text-gray-700"
                      }`}
                    >
                      <option value="">Alle Benutzer</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    {/* User Icon */}
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      selectedUserId ? "text-blue-500" : "text-gray-400"
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    {/* Dropdown Arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Favorites Filter Button */}
                {currentUserId && (
                  <Button
                    onClick={handleToggleFavoritesFilter}
                    variant="outline"
                    size="sm"
                    className={`px-3 py-2 border transition-all duration-200 flex items-center gap-2 ${
                      showFavoritesOnly
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                        : 'border-gray-300 hover:bg-gray-50 bg-white text-gray-600'
                    }`}
                    title={showFavoritesOnly ? "Alle Rezepte anzeigen" : "Nur Favoriten anzeigen"}
                  >
                    <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">
                      {showFavoritesOnly ? 'Alle' : 'Favoriten'}
                    </span>
                  </Button>
                )}

                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => handleViewModeChange('cards')}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'cards'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Kartenansicht"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Karten</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'list'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Listenansicht"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Liste</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={viewMode === 'cards' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
              <AnimatePresence>
                {finalFilteredHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={`cursor-pointer hover:shadow-md transition-all duration-200 bg-white group overflow-hidden ${
                        viewMode === 'list'
                          ? 'flex flex-row border-l-4 border-l-blue-200 border border-gray-200 hover:border-l-blue-400 shadow-sm'
                          : 'border border-gray-200'
                      }`}
                      onClick={() => onSelectRecipe(item)}
                    >
                      <div className={`relative ${viewMode === 'list' ? 'w-32 h-24 flex-shrink-0' : ''}`}>
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt="Recipe"
                          width={300}
                          height={200}
                          className={viewMode === 'list' ? "w-32 h-24 object-cover" : "w-full h-40 object-cover"}
                        />
                        {viewMode === 'cards' && (
                          <div className="absolute top-3 right-3 flex gap-1">
                            {/* Favorite Button - Always visible for logged users */}
                            {currentUserId && (
                              <button
                                onClick={(e) => handleToggleFavorite(item, e)}
                                className={`p-2 rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                                  item.isFavorite
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                title={item.isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                              >
                                <Star className={`h-3 w-3 ${item.isFavorite ? 'fill-current' : ''}`} />
                              </button>
                            )}
                            {/* Delete Button - Only for users who can edit */}
                            {canUserEditRecipe(item.user_id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRecipe(item)
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100"
                                title="Rezept löschen"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <CardContent className={viewMode === 'list' ? "p-4 flex-1 relative" : "p-4"}>
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1 pr-2">
                            {item.title || extractRecipeTitle(item.analysis)}
                          </h4>
                          {viewMode === 'list' && (
                            <div className="flex gap-1 items-center">
                              {/* Favorite Button - Always visible for logged users */}
                              {currentUserId && (
                                <button
                                  onClick={(e) => handleToggleFavorite(item, e)}
                                  className={`p-1.5 rounded-full shadow-sm transition-all mr-2 duration-200 flex-shrink-0 ${
                                    item.isFavorite
                                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                  }`}
                                  title={item.isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                                >
                                  <Star className={`h-3 w-3 ${item.isFavorite ? 'fill-current' : ''}`} />
                                </button>
                              )}
                              {/* Delete Button - Only for users who can edit */}
                              {canUserEditRecipe(item.user_id) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteRecipe(item)
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm transition-all duration-200 flex-shrink-0"
                                  title="Rezept löschen"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Calendar className="h-3 w-3" />
                          <span>Von {getUserName(item.user_id)} • {formatDate(item.date)}</span>
                        </div>

                        {/* Category dropdown - Only show if user can edit this recipe */}
                        {canUserEditRecipe(item.user_id) && (
                          <div className={viewMode === 'list' ? "mb-1" : "mb-4"}>
                            <select
                              value={item.folderId || ""}
                              onChange={(e) => {
                                e.stopPropagation()
                                moveToFolder(item.id, e.target.value || undefined)
                              }}
                              className={`text-xs rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 cursor-pointer hover:bg-gray-100 ${
                                viewMode === 'list'
                                  ? 'w-auto min-w-[120px] max-w-[150px] px-2 py-1 text-xs'
                                  : 'w-full p-2'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">📂 Uncategorized</option>
                              {getMainCategories().flatMap((folder) => [
                                <option key={folder.id} value={folder.id}>
                                  📁 {folder.name}
                                </option>,
                                ...getSubcategories(folder.id).map((subcategory) => (
                                  <option key={subcategory.id} value={subcategory.id}>
                                    &nbsp;&nbsp;&nbsp;&nbsp;📂 {subcategory.name}
                                  </option>
                                )),
                              ])}
                            </select>
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Ver más button - Only show if not searching and has more recipes */}
            {!searchQuery && hasMoreRecipes && finalFilteredHistory.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMoreRecipes}
                  disabled={isLoadingMore}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 font-medium"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Lädt...
                    </>
                  ) : (
                    'Mehr anzeigen'
                  )}
                </Button>
              </div>
            )}

            {finalFilteredHistory.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="h-8 w-8 text-gray-400" /> : <ChefHat className="h-8 w-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "Keine Rezepte gefunden" : "No recipes found"}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Keine Rezepte für "${searchQuery}" gefunden. Versuchen Sie einen anderen Suchbegriff.`
                    : selectedFolder === "favorites"
                    ? "You haven't marked any recipes as favorites yet"
                    : "No recipes in this category yet"}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Rezept löschen?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sind Sie sicher, dass Sie dieses Rezept löschen möchten?
            </p>
            {recipeToDelete && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={recipeToDelete.image || "/placeholder.svg"}
                    alt="Recipe"
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {recipeToDelete.title || extractRecipeTitle(recipeToDelete.analysis)}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatDate(recipeToDelete.date)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteModalOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                Abbrechen
              </Button>
              <Button
                onClick={confirmDeleteRecipe}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Löscht...
                  </>
                ) : (
                  'Löschen'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Modal */}
      <Dialog open={deleteCategoryModalOpen} onOpenChange={setDeleteCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              {categoryToDelete?.isSubcategory ? 'Unterkategorie löschen?' : 'Kategorie löschen?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sind Sie sicher, dass Sie diese {categoryToDelete?.isSubcategory ? 'Unterkategorie' : 'Kategorie'} löschen möchten?
            </p>
            {categoryToDelete && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Folder className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      {categoryToDelete.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {categoryToDelete.isSubcategory ? 'Unterkategorie' : 'Hauptkategorie'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Alle Rezepte in dieser {categoryToDelete?.isSubcategory ? 'Unterkategorie' : 'Kategorie'} werden auf "Unkategorisiert" verschoben.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setDeleteCategoryModalOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={isDeletingCategory}
              >
                Abbrechen
              </Button>
              <Button
                onClick={confirmDeleteCategory}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeletingCategory}
              >
                {isDeletingCategory ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Löscht...
                  </>
                ) : (
                  'Löschen'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RecipeArchivePage
