import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddFavorito, useRemoveFavoritoByLicitacion } from '../hooks/use-favoritos';

interface FavoritoButtonProps {
  licitacionId: string;
  isSaved: boolean;
}

export function FavoritoButton({ licitacionId, isSaved }: FavoritoButtonProps) {
  const { t } = useTranslation('favoritos');
  const addFavorito = useAddFavorito();
  const removeFavorito = useRemoveFavoritoByLicitacion();

  const isLoading = addFavorito.isPending || removeFavorito.isPending;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSaved) {
      removeFavorito.mutate(licitacionId);
    } else {
      addFavorito.mutate({ licitacionId });
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isSaved ? t('button.remove') : t('button.save')}
      aria-pressed={isSaved}
      className="shrink-0"
    >
      <Heart
        size={16}
        className={isSaved ? 'fill-primary text-primary' : 'text-muted-foreground'}
      />
    </Button>
  );
}