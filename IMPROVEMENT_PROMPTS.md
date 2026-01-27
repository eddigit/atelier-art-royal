# Prompts d'Amélioration pour l'Équipe de Développement

Voici une série de tâches techniques (Prompts) prêtes à être intégrées dans votre gestionnaire de tâches ou données à un assistant IA pour correction.

---

## 🚀 Tâche 1 : Unification de la Recherche & UX Navigation
**Priorité : Haute**
**Contexte :** L'utilisateur ne peut pas chercher de produits depuis l'accueil, et la page catalogue a des champs de recherche redondants.

**Prompt pour le Développeur :**
> "Je souhaite améliorer l'expérience de recherche sur le site.
> 1. **Header (`Layout.jsx`) :** Ajoute une icône de loupe ou une barre de recherche discrète dans le header (desktop et mobile). À la soumission, redirige vers `/Catalog?search=TERME`.
> 2. **Page Catalogue (`Catalog.jsx`) :** Simplifie l'interface.
>    - Si `AdvancedSearchBar` est affiché en haut, supprime le champ "Recherche" (`Input`) qui se trouve dans le composant `Filters` (sidebar) pour éviter la duplication.
>    - Garde uniquement les filtres à facettes (Rites, Catégories, Prix) dans la sidebar.
> 3. **Mobile :** Assure-toi que la barre de recherche est visible en haut du menu mobile (`Sheet` ou menu déroulant)."

---

## 🤖 Tâche 2 : Amélioration du Contexte IA (ChatWidget)
**Priorité : Moyenne**
**Contexte :** L'IA ne sait pas ce que l'utilisateur regarde actuellement, ce qui limite sa capacité à conseiller.

**Prompt pour le Développeur :**
> "L'assistant IA (`ChatWidget.jsx`) doit être conscient du contexte de navigation.
> 1. Modifie l'appel à la fonction `aiChat` pour inclure un objet `page_context`.
>    - Si l'utilisateur est sur une page produit, envoie `{ type: 'product', product_id: ID, product_name: NAME }`.
>    - Si l'utilisateur est sur le catalogue avec filtres, envoie `{ type: 'catalog', filters: ACTIVE_FILTERS }`.
> 2. Dans le backend (`functions/aiChat.ts`), injecte ce contexte au début du message système ou du message utilisateur.
>    - Exemple : 'L'utilisateur consulte actuellement le produit : [Nom du Produit]. Adapte tes réponses en conséquence.'
> 3. Ajoute une étape de confirmation pour la génération de lead : l'IA doit demander 'Voulez-vous que je transmette cette demande de devis à l'atelier ?' avant de déclencher la création du lead."

---

## 📐 Tâche 3 : Identité Maçonnique & Personnalisation Profil
**Priorité : Haute (Stratégique)**
**Contexte :** Le site manque de fonctionnalités spécifiques à la cible (francs-maçons).

**Prompt pour le Développeur :**
> "Nous devons personnaliser l'expérience pour nos membres.
> 1. **Base de Données :** Ajoute les champs `obedience`, `rite`, `lodge_name`, `degree` à la table/entité `User` (ou `Profile`).
> 2. **Page Mon Compte (`Account.jsx`) :** Ajoute un onglet ou une section 'Mon Parcours Maçonnique'.
>    - Ajoute des sélecteurs pour Obédience et Rite (basés sur les listes existantes en BDD).
>    - Ajoute un champ texte libre pour le nom de la Loge.
> 3. **Logique :** Si ces champs sont remplis, passe-les au contexte de l'IA (`aiChat`) pour qu'elle puisse dire 'En tant que membre de la GLNF...' ou recommander des produits adaptés."

---

## 🧵 Tâche 4 : Personnalisation Produit (Haute Couture)
**Priorité : Moyenne**
**Contexte :** Les clients doivent pouvoir annoter leur commande (broderie, taille spéciale) sans quitter la page.

**Prompt pour le Développeur :**
> "Sur la page `ProductDetail.jsx` :
> 1. Ajoute une zone de texte (Textarea) optionnelle intitulée 'Notes de personnalisation / Broderie'.
> 2. Lors du clic sur 'Ajouter au panier', sauvegarde ce texte dans l'objet `CartItem` (champ `custom_notes` ou `metadata`).
> 3. Affiche cette note dans le `CartSidebar` et dans le récapitulatif `Checkout` pour que l'utilisateur puisse vérifier sa demande.
> 4. Assure-toi que cette note est bien transmise à la commande finale en base de données."

---

## ⚡ Tâche 5 : Optimisation Scalabilité IA
**Priorité : Basse (Dette Technique)**
**Contexte :** L'IA charge tous les produits dans le prompt, ce qui cassera quand le catalogue grandira.

**Prompt pour le Développeur :**
> "Optimise la fonction `functions/aiChat.ts` pour supporter un grand catalogue.
> Au lieu de charger `base44.entities.Product.filter({}, limit=200)`, implémente une approche RAG simplifiée ou une recherche par mots-clés :
> 1. Analyse la question de l'utilisateur pour extraire des mots-clés (ex: 'tablier', 'maître', 'rouge').
> 2. Fais une requête en base de données pour trouver les produits correspondants à ces mots-clés.
> 3. N'injecte dans le contexte du prompt système QUE les 5-10 produits les plus pertinents trouvés, au lieu de toute la liste.
> Cela réduira les coûts de tokens et améliorera la précision."
