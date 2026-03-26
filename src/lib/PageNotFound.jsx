import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-primary/40 mx-auto"></div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">
              Page introuvable
            </h2>
            <p className="text-slate-600 leading-relaxed">
              La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              to="/Catalog"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
