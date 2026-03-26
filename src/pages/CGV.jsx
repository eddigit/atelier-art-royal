import React from 'react';

export default function CGV() {
  React.useEffect(() => {
    document.title = 'Conditions Générales de Vente - Atelier Art Royal';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">Conditions Générales de Vente</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Article 1 - Objet</h2>
          <p>
            Les présentes conditions générales de vente (CGV) régissent les ventes de produits effectuées par Atelier Art Royal via le site artroyal.fr. Toute commande implique l'acceptation sans réserve des présentes CGV.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 2 - Produits</h2>
          <p>
            Les produits proposés à la vente sont décrits et présentés avec la plus grande exactitude possible. Les photographies sont les plus fidèles possible mais ne constituent pas un engagement contractuel, notamment en ce qui concerne les couleurs.
          </p>
          <p>
            Nos produits sont fabriqués en France avec le plus grand soin. Les articles sur-mesure sont réalisés selon les spécifications convenues avec le client.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 3 - Prix</h2>
          <p>
            Les prix sont indiqués en euros TTC (toutes taxes comprises). Atelier Art Royal se réserve le droit de modifier ses prix à tout moment, mais les produits seront facturés au prix en vigueur lors de l'enregistrement de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 4 - Commande</h2>
          <p>
            Toute commande constitue un contrat conclu à distance entre le client et Atelier Art Royal. Un email de confirmation récapitulant la commande est envoyé au client.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 5 - Paiement</h2>
          <p>
            Le paiement s'effectue en ligne par carte bancaire via notre prestataire de paiement sécurisé SumUp. Le débit est effectué au moment de la validation de la commande.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 6 - Livraison</h2>
          <p>
            Les produits sont livrés à l'adresse de livraison indiquée lors de la commande. Les délais de livraison sont de 5 à 7 jours ouvrés pour les produits en stock. Pour les articles sur-mesure, un délai spécifique sera communiqué.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 7 - Droit de rétractation</h2>
          <p>
            Conformément à l'article L221-18 du Code de la consommation, le client dispose d'un délai de 14 jours à compter de la réception du produit pour exercer son droit de rétractation, sans avoir à justifier de motif ni à payer de pénalité.
          </p>
          <p>
            <strong>Exception :</strong> les produits sur-mesure ou personnalisés ne sont pas soumis au droit de rétractation (article L221-28 du Code de la consommation).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 8 - Garanties</h2>
          <p>
            Les produits bénéficient de la garantie légale de conformité (articles L217-4 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Article 9 - Contact</h2>
          <p>
            Pour toute question ou réclamation :<br />
            Email : <a href="mailto:contact@artroyal.fr" className="text-primary hover:underline">contact@artroyal.fr</a><br />
            Téléphone : <a href="tel:+33646683610" className="text-primary hover:underline">+33 6 46 68 36 10</a>
          </p>
        </section>
      </div>
    </div>
  );
}
