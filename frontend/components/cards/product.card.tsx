import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { toast } from 'react-toastify';

interface ProductCardProps {
  product: any;
  showActions?: boolean;
}

export default function ProductCard({product, showActions = true}: ProductCardProps) {
    const { wishlist, addToWishlist, removeFromWishlist } = useStore();
const { user } = useUser();

const handleProductPress = (product: any) => {
  router.push({
    pathname: "/(routes)/product/[id]",
    params: {
      id: product.slug || product.id,
    },
  });
};

const handleWishlistToggle = (product: any, e: any) => {
  e.stopPropagation();

  if (!user) {
    toast.error("Please login to add items to wishlist");
    return;
  }

  const isInWishlist = wishlist.some((item) => item.id === product.id);

  if (isInWishlist) {
    removeFromWishlist(product.id, user, null, "Mobile App");
    toast.success("Removed from wishlist");
  } else {
 addToWishlist(
  {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: product.sale_price || product.regular_price,
    image: product.images?.[0]?.url || "",
    shopId: product.shop?.id || "",
  },
  user,
  null,
  "Mobile App"
); 
toast.success("Added to wishlist");
  }
};

const isInWishlist = (productId: string) => {
  return wishlist.some((item) => item.id === productId);
};

const discountPercentage = product?.sale_price
  ? Math.round(
      ((product.regular_price - product.sale_price) /
        product.regular_price) *
        100
    )
  : 0;

  return (
   <TouchableOpacity
  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
  style={{ width: '48%' }}
onPress={() => handleProductPress(product)}
activeOpacity={0.9}
>
  <Text>ProductCard</Text>
</TouchableOpacity>
  );
}