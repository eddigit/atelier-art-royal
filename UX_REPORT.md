# Rapport d'Audit UX & Technique - Atelier Art Royal

## Synthèse
L'application présente une base solide pour un e-commerce moderne (Stack React/Vite/Tailwind, Design System propre). Le parcours d'achat standard est fonctionnel. Cependant, **plusieurs points critiques** doivent être adressés avant la mise en production pour répondre aux attentes spécifiques d'une clientèle exigeante (Franc-Maçonnerie) et assurer une expérience fluide.

## 1. Navigation & Recherche (Critique 🔴)
*   **Absence de Recherche Globale :** Le header (`Layout.jsx`) ne contient aucune barre de recherche. L'utilisateur doit naviguer vers le "Catalogue" pour pouvoir chercher un produit. C'est un frein majeur à la conversion.
*   **Doublon sur la page Catalogue :** La page `Catalog.jsx` affiche deux champs de recherche concurrents : l'un dans la barre supérieure (`AdvancedSearchBar`) et l'autre dans la barre latérale (`Filters`). Cela crée une confusion visuelle et fonctionnelle.
*   **Menu Mobile :** L'accès à la recherche est inexistant dans le menu mobile actuel.

## 2. Intelligence Artificielle & Chat (Moyen 🟠)
*   **Points Forts :** L'intégration de Groq est fonctionnelle et le prompt système est bien travaillé (ton adapté, règles strictes). La suggestion de produits via tags `[PRODUCT:id]` est une excellente fonctionnalité.
*   **Limitation de Contexte :** L'IA ne connaît pas le contexte de navigation de l'utilisateur. Si un utilisateur est sur la page d'un "Tablier de Maître" et demande "Est-il disponible en rouge ?", l'IA ne sait pas de quel produit il parle.
*   **Scalabilité :** Le script `aiChat.ts` charge les **200 derniers produits** pour les injecter dans le prompt système. Si le catalogue dépasse 200 produits, les anciens produits deviendront invisibles pour l'IA.
*   **Génération de Leads :** La création de lead est automatique basée sur des mots-clés (`recontacter`, `devis`). Cela risque de créer des "faux positifs" (leads non désirés) si l'utilisateur ne confirme pas explicitement.

## 3. Spécificités Audience "Art Royal" (Manquant 🔴)
*   **Absence de "Tuilage" Numérique :** Il n'existe aucun mécanisme pour vérifier l'appartenance d'un utilisateur à une Loge ou une Obédience. Tous les utilisateurs sont traités comme des clients génériques.
*   **Profil Pauvre :** Le profil utilisateur (`Account.jsx`) ne permet pas de renseigner son Obédience, son Rite ou sa Loge. C'est une opportunité manquée pour la personnalisation (ex: recommander des décors REAA si l'utilisateur est REAA).
*   **Discrétion :** Pas de "Mode Discret" ou de "Panic Button" pour masquer rapidement le contenu maçonnique, une fonctionnalité souvent appréciée par cette communauté.

## 4. Parcours Produit & Achat (Améliorable 🟠)
*   **Personnalisation Manquante :** Pour de la "Haute Couture", la page produit (`ProductDetail.jsx`) ne propose aucun champ texte pour ajouter une note ou une demande de broderie simple. L'utilisateur est forcé d'appeler ou d'envoyer un email à part.
*   **Guide des Tailles :** Absence de guide des tailles contextuel près du sélecteur de taille.
*   **Validation Checkout :** La validation du formulaire de commande est basique. L'utilisation d'une librairie de validation (ex: Zod) serait plus robuste.

## Recommandations Prioritaires
1.  Intégrer une **barre de recherche globale** dans le header.
2.  Ajouter les champs **Obédience / Rite / Loge** dans le profil client.
3.  Permettre la **personnalisation simple** (champ texte) directement sur la fiche produit.
4.  Améliorer le contexte de l'IA (lui envoyer l'URL ou le produit consulté).
