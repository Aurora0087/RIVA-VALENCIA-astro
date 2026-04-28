import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, isOnSale, type ShopifyProduct } from '@/lib/shopify';

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = product.compareAtPriceRange.minVariantPrice;
  const onSale = isOnSale(product);
  const productUrl = `/products/${product.handle}`;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-secondary">
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && (
            <Badge variant="destructive" className="text-[10px]">
              Sale
            </Badge>
          )}
          {!product.availableForSale && (
            <Badge variant="secondary" className="text-[10px]">
              Sold Out
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {product.vendor && (
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {product.vendor}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{product.title}</h3>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-base font-bold ${onSale ? 'text-destructive' : 'text-foreground'}`}>
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          className="w-full"
          variant={product.availableForSale ? 'default' : 'secondary'}
          disabled={!product.availableForSale}
        >
          <a href={productUrl}>
            {product.availableForSale ? 'View Product' : 'Out of Stock'}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
