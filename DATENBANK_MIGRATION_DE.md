# 🍳 Recipe Digitizer Datenbank Migration

## 📋 Vollständige Anleitung zur Migration von localStorage zu MySQL mit HostPoint

### 🎯 Ziel
Migration der gesamten Recipe Digitizer Anwendung von lokalem Speicher (localStorage) zu einer MySQL-Datenbank mit PHP-API, unter Beibehaltung aller aktuellen Funktionen und Hinzufügung neuer Features.

---

## 📊 Aktueller Zustand der Anwendung

### Daten, die in localStorage gespeichert werden:
- `recipe-servings` - Portionsgrößen der Rezepte
- `recipe-original-servings` - Ursprüngliche Portionsgrößen
- `recipeHistory` - Verlauf der analysierten Rezepte
- `recipeFolders` - Organisationsordner
- `recipe-images-{id}` - Rezeptbilder (Base64)
- `recipeDigitizerSettings` - Benutzereinstellungen
- `recipe-auth` - Authentifizierungsstatus
- `user-role` - Benutzerrolle (admin/worker/guest)
- `userRecipes` - Benutzerrezepte
- `userNotifications` - Benachrichtigungen

### Aktuelle Technologien:
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Radix UI + Tailwind CSS
- **Speicher**: localStorage (Browser)
- **Authentifizierung**: Einfach mit localStorage

---

## 🗄️ MySQL Datenbankstruktur

### Tabelle: `users`
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'worker', 'guest') DEFAULT 'guest',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
```

### Tabelle: `recipes`
```sql
CREATE TABLE recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    servings INT DEFAULT 2,
    original_servings INT DEFAULT 2,
    folder_id INT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    tags JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    prep_time INT, -- Minuten
    cook_time INT, -- Minuten
    calories_per_serving INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    INDEX idx_user_recipes (user_id),
    INDEX idx_public_recipes (is_public),
    FULLTEXT KEY ft_recipe_search (title, content)
);
```

### Tabelle: `folders`
```sql
CREATE TABLE folders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex Farbe
    is_shared BOOLEAN DEFAULT FALSE,
    parent_folder_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    INDEX idx_user_folders (user_id)
);
```

### Tabelle: `recipe_images`
```sql
CREATE TABLE recipe_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    image_data LONGTEXT NOT NULL, -- Base64 kodiert
    image_name VARCHAR(255),
    image_size INT, -- Bytes
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_images (recipe_id)
);
```

### Tabelle: `user_settings`
```sql
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
);
```

### Tabelle: `notifications`
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read)
);
```

### Tabelle: `recipe_history`
```sql
CREATE TABLE recipe_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    action ENUM('created', 'viewed', 'edited', 'deleted') NOT NULL,
    metadata JSON, -- zusätzliche Verlaufsdaten
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_user_history (user_id, created_at)
);
```

### Tabelle: `sessions` (für Authentifizierung)
```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_expiry (expires_at)
);
```

---

## 🔌 PHP API Struktur

### Ordnerstruktur bei HostPoint:
```
/public_html/deine-domain/
├── api/
│   ├── config/
│   │   ├── database.php
│   │   ├── cors.php
│   │   └── auth.php
│   ├── middleware/
│   │   ├── auth_middleware.php
│   │   └── role_middleware.php
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── UserController.php
│   │   ├── RecipeController.php
│   │   ├── FolderController.php
│   │   ├── ImageController.php
│   │   └── AdminController.php
│   ├── models/
│   │   ├── User.php
│   │   ├── Recipe.php
│   │   ├── Folder.php
│   │   └── Database.php
│   ├── utils/
│   │   ├── response.php
│   │   ├── validation.php
│   │   └── helpers.php
│   └── endpoints/
│       ├── auth.php
│       ├── users.php
│       ├── recipes.php
│       ├── folders.php
│       ├── images.php
│       ├── admin.php
│       └── settings.php
├── install/
│   ├── setup.php
│   ├── migrate.php
│   └── database.sql
└── _next/ (kompilierte Next.js Dateien)
```

### API-Endpunkte:

#### **Authentifizierung**
- `POST /api/auth.php?action=login` - Anmelden
- `POST /api/auth.php?action=logout` - Abmelden
- `POST /api/auth.php?action=register` - Benutzer registrieren
- `GET /api/auth.php?action=verify` - Sitzung überprüfen
- `POST /api/auth.php?action=forgot-password` - Passwort zurücksetzen

#### **Benutzer**
- `GET /api/users.php` - Benutzer auflisten (Admin)
- `GET /api/users.php?id={id}` - Spezifischen Benutzer abrufen
- `POST /api/users.php` - Benutzer erstellen
- `PUT /api/users.php?id={id}` - Benutzer aktualisieren
- `DELETE /api/users.php?id={id}` - Benutzer löschen
- `GET /api/users.php?action=profile` - Aktuelles Benutzerprofil

#### **Rezepte**
- `GET /api/recipes.php` - Benutzerrezepte auflisten
- `GET /api/recipes.php?id={id}` - Spezifisches Rezept abrufen
- `POST /api/recipes.php` - Neues Rezept erstellen
- `PUT /api/recipes.php?id={id}` - Rezept aktualisieren
- `DELETE /api/recipes.php?id={id}` - Rezept löschen
- `GET /api/recipes.php?action=public` - Öffentliche Rezepte
- `GET /api/recipes.php?action=search&q={query}` - Rezepte suchen

#### **Ordner**
- `GET /api/folders.php` - Benutzerordner auflisten
- `POST /api/folders.php` - Ordner erstellen
- `PUT /api/folders.php?id={id}` - Ordner aktualisieren
- `DELETE /api/folders.php?id={id}` - Ordner löschen
- `POST /api/folders.php?action=move&recipe_id={id}&folder_id={id}` - Rezept verschieben

#### **Bilder**
- `POST /api/images.php` - Bild hochladen
- `GET /api/images.php?recipe_id={id}` - Rezeptbilder abrufen
- `DELETE /api/images.php?id={id}` - Bild löschen

#### **Einstellungen**
- `GET /api/settings.php` - Benutzereinstellungen abrufen
- `POST /api/settings.php` - Einstellungen speichern
- `PUT /api/settings.php?key={key}` - Spezifische Einstellung aktualisieren

#### **Administration**
- `GET /api/admin.php?action=stats` - Systemstatistiken
- `GET /api/admin.php?action=users` - Benutzerverwaltung
- `POST /api/admin.php?action=user-role` - Benutzerrolle ändern
- `GET /api/admin.php?action=system-settings` - Systemeinstellungen

---

## 🚀 Deployment-Prozess

### 1. Hosting-Vorbereitung (HostPoint)

#### Datenbank erstellen:
1. HostPoint Panel aufrufen
2. Neue MySQL-Datenbank erstellen
3. Datenbankbenutzer erstellen
4. Vollständige Berechtigungen für den Benutzer zuweisen

#### FTP konfigurieren:
1. FTP-Zugangsdaten vom Hosting abrufen
2. FTP-Zugang auf dem lokalen PC konfigurieren

### 2. Deployment-Skript (`deploy.sh`)

```bash
#!/bin/bash

# Konfiguration
FTP_HOST="ftp.dein-hosting.com"
FTP_USER="dein_ftp_benutzer"
FTP_PASS="dein_ftp_passwort"
REMOTE_PATH="/public_html/deine-domain"
LOCAL_BUILD_PATH="./out"

echo "🚀 Starte Deployment von Recipe Digitizer..."

# 1. Next.js Anwendung kompilieren
echo "📦 Kompiliere Next.js Anwendung..."
npm run build
npm run export

# 2. Überprüfen, ob Build erfolgreich war
if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo "❌ Fehler: Build-Verzeichnis nicht gefunden"
    exit 1
fi

# 3. Dateien via FTP hochladen
echo "📤 Lade Dateien auf den Server hoch..."
lftp -c "
set ftp:ssl-allow no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
mirror -R $LOCAL_BUILD_PATH $REMOTE_PATH/_next --verbose
put api/ $REMOTE_PATH/api/
put install/ $REMOTE_PATH/install/
quit
"

# 4. Deployment überprüfen
echo "✅ Deployment abgeschlossen!"
echo "🌐 Deine Anwendung ist verfügbar unter: https://deine-domain.com"
echo "🔧 Führe die Installation aus unter: https://deine-domain.com/install/setup.php"
```

### 3. Automatisierung mit GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to HostPoint

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Abhängigkeiten installieren
      run: npm install

    - name: Anwendung kompilieren
      run: npm run build && npm run export

    - name: Via FTP deployen
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: ${{ secrets.FTP_HOST }}
        username: ${{ secrets.FTP_USER }}
        password: ${{ secrets.FTP_PASS }}
        local-dir: ./out/
        server-dir: /public_html/deine-domain/
```

---

## 🔄 Datenmigration

### 1. Migration von localStorage zu MySQL

#### Frontend - localStorage-Daten exportieren:
```javascript
// Funktion zum Exportieren aller localStorage-Daten
function exportLocalStorageData() {
  const data = {
    recipes: JSON.parse(localStorage.getItem('recipeHistory') || '[]'),
    folders: JSON.parse(localStorage.getItem('recipeFolders') || '[]'),
    settings: JSON.parse(localStorage.getItem('recipeDigitizerSettings') || '{}'),
    userRecipes: JSON.parse(localStorage.getItem('userRecipes') || '[]'),
    notifications: JSON.parse(localStorage.getItem('userNotifications') || '[]'),
    servings: localStorage.getItem('recipe-servings'),
    originalServings: localStorage.getItem('recipe-original-servings'),
    auth: localStorage.getItem('recipe-auth'),
    userRole: localStorage.getItem('user-role')
  };

  // Bilder exportieren
  const images = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('recipe-images-')) {
      images[key] = localStorage.getItem(key);
    }
  }
  data.images = images;

  return data;
}

// Migrationsdatei erstellen
function downloadMigrationFile() {
  const data = exportLocalStorageData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recipe-digitizer-migration.json';
  a.click();
}
```

#### Backend - PHP-Import-Skript:
```php
// install/migrate.php
<?php
// Skript zum Importieren von Daten aus der Migrationsdatei
if ($_POST['action'] === 'import') {
    $uploadedFile = $_FILES['migration_file'];
    $migrationData = json_decode(file_get_contents($uploadedFile['tmp_name']), true);

    // Benutzer, Rezepte, Ordner usw. importieren
    importMigrationData($migrationData);
}
?>
```

### 2. Daten-Mapping

#### localStorage → MySQL:
- `recipeHistory` → Tabelle `recipes` + `recipe_history`
- `recipeFolders` → Tabelle `folders`
- `recipe-images-*` → Tabelle `recipe_images`
- `userRecipes` → Tabelle `recipes`
- `userNotifications` → Tabelle `notifications`
- `recipeDigitizerSettings` → Tabelle `user_settings`
- `recipe-auth` + `user-role` → Tabelle `users` + `sessions`

---

## 🔐 Authentifizierungssystem

### 1. Authentifizierungsfluss
1. **Anmeldung**: Benutzer sendet Anmeldedaten → API validiert → generiert Session-Token
2. **Middleware**: Jede Anfrage überprüft Session-Token
3. **Rollen**: Admin, Worker, Guest mit unterschiedlichen Berechtigungen
4. **Abmeldung**: Invalidiert Session-Token

### 2. Sicherheit
- Passwörter mit `password_hash()` PHP gehashed
- Sessions mit sicheren Tokens
- CSRF-Validierung
- Rate Limiting beim Login
- HTTPS obligatorisch in Produktion

---

## 👤 Administrationspanel

### Admin-Funktionen:
1. **Benutzerverwaltung**
   - Benutzerliste anzeigen
   - Benutzer erstellen/bearbeiten/löschen
   - Rollen und Berechtigungen ändern
   - Nutzungsstatistiken anzeigen

2. **Inhaltsverwaltung**
   - Alle Systemrezepte anzeigen
   - Öffentliche Inhalte moderieren
   - Geteilte Ordner verwalten
   - Rezeptstatistiken

3. **Systemkonfiguration**
   - Globale Einstellungen
   - Speicherlimits
   - E-Mail-Konfiguration
   - Backup und Wartung

4. **Statistiken und Berichte**
   - Aktive Benutzer
   - Erstellte Rezepte nach Zeitraum
   - Speicherverbrauch
   - Aktivitätsprotokolle

---

## 📱 Frontend-Aktualisierung

### 1. localStorage durch API-Aufrufe ersetzen:
```typescript
// hooks/useApi.ts
export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);

  const fetchRecipes = async () => {
    const response = await fetch('/api/recipes.php');
    const data = await response.json();
    setRecipes(data);
  };

  const createRecipe = async (recipe) => {
    await fetch('/api/recipes.php', {
      method: 'POST',
      body: JSON.stringify(recipe)
    });
    fetchRecipes(); // Aktualisieren
  };

  return { recipes, fetchRecipes, createRecipe };
};
```

### 2. Context für Authentifizierung:
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    const response = await fetch('/api/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🛠️ Installation und Konfiguration

### 1. Installationsschritte:

1. **Hosting vorbereiten**
   - MySQL-Datenbank erstellen
   - FTP konfigurieren
   - Dateien hochladen

2. **Setup ausführen**
   - `/install/setup.php` besuchen
   - DB-Verbindung konfigurieren
   - Ersten Admin-Benutzer erstellen
   - Tabellenstruktur importieren

3. **Daten migrieren**
   - localStorage-Daten exportieren
   - Via `/install/migrate.php` importieren
   - Migration überprüfen

4. **Frontend konfigurieren**
   - API-Endpunkte aktualisieren
   - Authentifizierung testen
   - Funktionen überprüfen

### 2. Produktionskonfiguration:

```php
// api/config/database.php
<?php
return [
    'host' => 'localhost', // oder MySQL-Server IP
    'dbname' => 'deine_datenbank',
    'username' => 'dein_db_benutzer',
    'password' => 'dein_db_passwort',
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
?>
```

---

## 🧪 Testing und Validierung

### 1. Funktions-Checkliste:
- [ ] Anmeldung/Abmeldung funktioniert korrekt
- [ ] Erstellen/Bearbeiten/Löschen von Rezepten
- [ ] Ordnerverwaltung
- [ ] Hochladen und Anzeigen von Bildern
- [ ] Administrationspanel
- [ ] Rollen und Berechtigungen
- [ ] Vollständige Datenmigration
- [ ] Backup und Wiederherstellung

### 2. API-Testing:
```bash
# Login-Test
curl -X POST "https://deine-domain.com/api/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"passwort"}'

# Rezepte-Test
curl -X GET "https://deine-domain.com/api/recipes.php" \
  -H "Authorization: Bearer dein_token"
```

---

## 📞 Support und Wartung

### 1. Automatisches Backup:
```bash
#!/bin/bash
# backup.sh - Täglich via Cron ausführen
mysqldump -u benutzer -p passwort datenbank > backup_$(date +%Y%m%d).sql
```

### 2. Überwachung:
- PHP-Fehlerprotokolle
- Festplattenplatz-Überwachung
- Sicherheitswarnungen
- Nutzungsstatistiken

### 3. Updates:
- API-Versionierung
- DB-Migrationen
- Frontend-Updates
- Sicherheits-Patches

---

## 🎉 Vorteile der Migration

1. **✅ Datenpersistenz**: Daten gehen beim Browser-Clearing nicht verloren
2. **👥 Multi-User**: Mehrere Benutzer können die Anwendung verwenden
3. **🔐 Sicherheit**: Robustes Authentifizierungssystem
4. **📊 Admin-Panel**: Zentrale Verwaltung von Benutzern und Inhalten
5. **📱 Synchronisation**: Zugriff von mehreren Geräten
6. **🔄 Backup**: Automatische Datensicherung
7. **⚡ Performance**: Bessere Leistung mit Datenbank
8. **🌐 Skalierbarkeit**: Einfaches Hinzufügen neuer Funktionen

---

## 🚨 Wichtige Überlegungen

1. **Backup**: Immer Backup vor Migration erstellen
2. **Testing**: Zuerst in Entwicklungsumgebung testen
3. **SSL**: HTTPS für Sicherheit konfigurieren
4. **Performance**: Datenbankabfragen optimieren
5. **Limits**: Speicherlimits konfigurieren
6. **Überwachung**: Logs und Warnungen implementieren

---

Bist du bereit, mit der Implementierung fortzufahren? 🚀