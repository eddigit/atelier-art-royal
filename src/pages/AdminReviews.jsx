import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, CheckCircle, XCircle, Search, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.ProductReview.list('-created_date', 500),
    initialData: []
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-reviews'],
    queryFn: () => base44.entities.Product.list('-created_date', 1000),
    initialData: []
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }) => base44.entities.ProductReview.update(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      queryClient.invalidateQueries(['reviews']);
      toast.success('Avis mis à jour');
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => base44.entities.ProductReview.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reviews']);
      queryClient.invalidateQueries(['reviews']);
      toast.success('Avis supprimé');
    }
  });

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Produit inconnu';
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.created_by?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && review.is_approved) ||
      (filterStatus === 'pending' && !review.is_approved);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        Gestion des <span className="text-gradient">Avis Clients</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total avis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 fill-primary text-primary" />
                <p className="text-2xl font-bold text-primary">{stats.averageRating}</p>
              </div>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les avis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les avis</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{review.created_by}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Badge variant="outline" className="mb-2">
                      {getProductName(review.product_id)}
                    </Badge>
                    {review.title && (
                      <h4 className="font-semibold mb-1">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground text-sm">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {review.is_approved ? (
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approuvé
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                        En attente
                      </Badge>
                    )}
                    {review.is_verified_purchase && (
                      <Badge variant="outline" className="text-xs">
                        Achat vérifié
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col gap-2">
                  {!review.is_approved ? (
                    <Button
                      size="sm"
                      onClick={() => updateReviewMutation.mutate({
                        reviewId: review.id,
                        data: { is_approved: true }
                      })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReviewMutation.mutate({
                        reviewId: review.id,
                        data: { is_approved: false }
                      })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteReviewMutation.mutate(review.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-20 text-center">
              <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun avis trouvé</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}