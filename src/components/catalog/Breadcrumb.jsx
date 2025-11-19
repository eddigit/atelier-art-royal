import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Breadcrumb({ filters }) {
  const { data: rites = [] } = useQuery({
    queryKey: ['rites'],
    queryFn: () => base44.entities.Rite.list('order', 100),
    initialData: []
  });

  const { data: obediences = [] } = useQuery({
    queryKey: ['obediences'],
    queryFn: () => base44.entities.Obedience.list('order', 100),
    initialData: []
  });

  const { data: degreeOrders = [] } = useQuery({
    queryKey: ['degreeOrders'],
    queryFn: () => base44.entities.DegreeOrder.list('level', 200),
    initialData: []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 100),
    initialData: []
  });

  const buildPath = () => {
    const path = [
      { label: 'Accueil', url: createPageUrl('Home'), icon: Home }
    ];

    // Rite
    if (filters.rite) {
      const rite = rites.find(r => r.id === filters.rite);
      if (rite) {
        path.push({
          label: rite.name,
          url: createPageUrl('Catalog') + `?rite=${filters.rite}`
        });
      }
    }

    // Obédience
    if (filters.obedience) {
      const obedience = obediences.find(o => o.id === filters.obedience);
      if (obedience) {
        const params = new URLSearchParams();
        if (filters.rite) params.append('rite', filters.rite);
        params.append('obedience', filters.obedience);
        
        path.push({
          label: obedience.name,
          url: createPageUrl('Catalog') + `?${params.toString()}`
        });
      }
    }

    // Type de Loge
    if (filters.logeType) {
      const params = new URLSearchParams();
      if (filters.rite) params.append('rite', filters.rite);
      if (filters.obedience) params.append('obedience', filters.obedience);
      params.append('logeType', filters.logeType);
      
      path.push({
        label: filters.logeType,
        url: createPageUrl('Catalog') + `?${params.toString()}`
      });
    }

    // Degré & Ordre
    if (filters.degreeOrder) {
      const degreeOrder = degreeOrders.find(d => d.id === filters.degreeOrder);
      if (degreeOrder) {
        const params = new URLSearchParams();
        if (filters.rite) params.append('rite', filters.rite);
        if (filters.obedience) params.append('obedience', filters.obedience);
        if (filters.logeType) params.append('logeType', filters.logeType);
        params.append('degreeOrder', filters.degreeOrder);
        
        path.push({
          label: degreeOrder.name,
          url: createPageUrl('Catalog') + `?${params.toString()}`
        });
      }
    }

    // Catégorie
    if (filters.category) {
      const category = categories.find(c => c.id === filters.category);
      if (category) {
        const params = new URLSearchParams();
        if (filters.rite) params.append('rite', filters.rite);
        if (filters.obedience) params.append('obedience', filters.obedience);
        if (filters.logeType) params.append('logeType', filters.logeType);
        if (filters.degreeOrder) params.append('degreeOrder', filters.degreeOrder);
        params.append('category', filters.category);
        
        path.push({
          label: category.name,
          url: createPageUrl('Catalog') + `?${params.toString()}`
        });
      }
    }

    // Recherche
    if (filters.search && path.length === 1) {
      path.push({
        label: `Recherche: "${filters.search}"`,
        url: createPageUrl('Catalog') + `?search=${encodeURIComponent(filters.search)}`
      });
    }

    // Filtres additionnels
    const additionalFilters = [];
    if (filters.showPromotions) additionalFilters.push('Promotions');
    if (filters.showNew) additionalFilters.push('Nouveautés');
    
    if (additionalFilters.length > 0 && path.length > 1) {
      path.push({
        label: additionalFilters.join(' • '),
        url: window.location.pathname + window.location.search,
        isFilter: true
      });
    }

    return path;
  };

  const breadcrumbPath = buildPath();

  // Ne pas afficher si seulement "Accueil"
  if (breadcrumbPath.length <= 1) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
      {breadcrumbPath.map((item, index) => {
        const isLast = index === breadcrumbPath.length - 1;
        const Icon = item.icon;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isLast ? (
              <span className={`font-medium ${item.isFilter ? 'text-primary' : 'text-foreground'}`}>
                {Icon && <Icon className="w-4 h-4 inline mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.url}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {Icon && <Icon className="w-4 h-4 inline mr-1" />}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}