import React from 'react';

export default function PolitiqueConfidentialite() {
  React.useEffect(() => {
    document.title = 'Politique de confidentialité - Atelier Art Royal';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">Politique de confidentialité</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Collecte des données</h2>
          <p>
            Atelier Art Royal collecte les données personnelles suivantes lors de la création de votre compte et de vos commandes : nom, prénom, adresse email, adresse de livraison, numéro de téléphone.
          </p>
          <p>
            Ces données sont nécessaires au traitement de vos commandes et à la gestion de votre compte client.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Utilisation des données</h2>
          <p>Vos données personnelles sont utilisées pour :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Traiter et suivre vos commandes</li>
            <li>Gérer votre compte client</li>
            <li>Vous contacter en cas de besoin concernant votre commande</li>
            <li>Améliorer nos services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Protection des données</h2>
          <p>
            Atelier Art Royal met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte, destruction ou altération.
          </p>
          <p>
            Les données de paiement sont traitées par notre prestataire de paiement sécurisé SumUp et ne sont jamais stockées sur nos serveurs.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Durée de conservation</h2>
          <p>
            Vos données personnelles sont conservées pendant la durée de votre relation commerciale avec Atelier Art Royal et pendant une durée de 3 ans à compter de votre dernière interaction, conformément à la réglementation en vigueur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Vos droits</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification de vos données</li>
            <li>Droit à l'effacement de vos données</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@artroyal.fr" className="text-primary hover:underline">contact@artroyal.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookies</h2>
          <p>
            Ce site utilise des cookies techniques nécessaires au bon fonctionnement du site (authentification, panier). Aucun cookie publicitaire ou de suivi n'est utilisé.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p>
            Pour toute question relative à la protection de vos données personnelles :<br />
            Email : <a href="mailto:contact@artroyal.fr" className="text-primary hover:underline">contact@artroyal.fr</a><br />
            Téléphone : <a href="tel:+33646683610" className="text-primary hover:underline">+33 6 46 68 36 10</a>
          </p>
        </section>
      </div>
    </div>
  );
}
