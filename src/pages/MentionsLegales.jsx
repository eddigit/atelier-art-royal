import React from 'react';

export default function MentionsLegales() {
  React.useEffect(() => {
    document.title = 'Mentions légales - Atelier Art Royal';
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-primary">Mentions légales</h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Éditeur du site</h2>
          <p>
            <strong>Atelier Art Royal</strong><br />
            Site internet : <a href="https://artroyal.fr" className="text-primary hover:underline">artroyal.fr</a><br />
            Email : <a href="mailto:contact@artroyal.fr" className="text-primary hover:underline">contact@artroyal.fr</a><br />
            Téléphone : <a href="tel:+33646683610" className="text-primary hover:underline">+33 6 46 68 36 10</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Hébergement</h2>
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong><br />
            440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
            Site : vercel.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Conception et réalisation</h2>
          <p>
            Design et développement e-commerce par <strong>Gilles Korzec</strong><br />
            <a href="https://coachdigitalparis.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">coachdigitalparis.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, vidéos, logos, marques) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Responsabilité</h2>
          <p>
            Atelier Art Royal s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Atelier Art Royal ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition. En conséquence, Atelier Art Royal décline toute responsabilité pour les imprécisions, inexactitudes ou omissions portant sur des informations disponibles sur le site.
          </p>
        </section>
      </div>
    </div>
  );
}
