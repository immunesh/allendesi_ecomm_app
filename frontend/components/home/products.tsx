import useUser from "@/hooks/useUser";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useStore } from "@/store";
import React, { useState } from "react";
import { Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

export default function ProductSection({
  title,
  products,
  showTimer = false,
  isFlashSale = false,
  hideTitle = false,
}: any) {
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  const { user } = useUser();
  const {wishlist,addToWishlist,removeFromWishlist} = useStore();

  const handleProductPress = (product: any) => {
    const productId = product.id;
    router.push(`/product/${productId}`);
  };

  const handleWishlistToggle = (product: any, e: any) => {
    e.stopPropagation();
    
    if(!user){
      Toast.show({
        type: "error",
        text1: "Please login to add products to wishlist",
      });
      return;
    }

    const inWishlist = isInWishlist(product.id);

    if(inWishlist){
      removeFromWishlist(product.id, user, null, "Mobile App");
    } else {
      const productImage = product.images?.[0]?.url || "";
      addToWishlist({
        id: product.id,
        price: product.sale_price || product.regular_price,
        image: productImage,
        shopId: product.Shop?.id || product.shopId || "",
        title: product.title,
        slug: product.slug,
      }, user, null, "Mobile App");
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };





  return (
    <View className="px-4 pb-6">
      {!hideTitle && (
        <View className="flex-row items-center justify-between mb-6">
          <Text
            className="text-2xl text-gray-900"
            style={{
              fontFamily: "Inter-SemiBold",
              fontWeight: Platform.OS === "android" ? "600" : "normal",
            }}
          >
            {title}
          </Text>

          {showTimer && (
            <View className="flex-row items-center bg-gradiant-to-r from-red-50 to-red-100 px-4 py-2 rounded-full shadow-sm">
              <Ionicons name="time" size={16} color="#EF4444" />
              <Text className="text-red-600 font-semibold ml-2 text-sm">
                02:30:45
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full"
            onPress={() => router.push("/products")}
          >
            <Text className="text-blue-600 font-semibold mr-1 text-sm">
              See All
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-1 pb-4 h-80"
      >
        <View className="flex-row px-1">
          {products?.map((product: any, index: number) => {
            const discountPercentage = product?.sale_price
              ? Math.round(
                  ((product.regular_price - product.sale_price) /
                    product.regular_price) *
                    100,
                )
              : 0;
            return (
              <View key={index} className={index > 0 ? "ml-4" : ""}>
                <TouchableOpacity
                  className="w-40 bg-white rounded-2xl border border-gray-50 overflow-hidden"
                  onPress={() => handleProductPress(product)}
                  activeOpacity={0.9}
                >
                  <View className="relative">
                    <Image
                      source={{
                        uri: product?.images?.[0]?.url || "",
                      }}
                      className="w-full h-28 bg-gray-100"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center"
                      activeOpacity={0.7}
                      onPress={(e)=>handleWishlistToggle(product, e)}
                    >
                      <Ionicons
                        name={isInWishlist(product.id) ? "heart" : "heart-outline"}
                        size={18}
                        color={"#EF4444"}
                      />
                    </TouchableOpacity>
                    {/* Flash Sale Timer or Discount Badge */}
                    {isFlashSale ? (
                      <View className="absolute top-3 left-3 bg-red-500/95 backdrop-blur-sm px-2 py-1.5 rounded-lg">
                        <View className="flex-row items-center">
                          <Ionicons name="flash" size={10} color="#FFFFFF" />
                          <Text className="text-white text-xs font-bold ml-1">
                            {timers[product.id] || "00:00:00"}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      discountPercentage > 0 && (
                        <View className="absolute top-3 left-3 bg-red-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">
                            -{discountPercentage}%
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                  <View className="flex-1 p-3 justify-between">
                    <View>
                      <View className="flex-row items-center mb-2 h-8">
                      <Image
                        source={{ uri: product?.Shop?.avatar || "" }}
                        className="w-6 h-6 rounded-full mr-2"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-xs text-gray-600 font-medium"
                          numberOfLines={1}
                        >
                          {product.Shop?.name || "Official Store"}
                        </Text>
                      </View>
                      </View>
                      <Text
                        className="text-sm font-poppins-semibold text-gray-800 mb-2 leading-4 min-h-[32px]"
                        numberOfLines={2}
                      >
                        {product.title}
                      </Text>
                      {/* Rating */}
                      <View className="flex-row items-center min-h-[18px]">
                        <View className="flex-row items-center">
                          <Ionicons name="star" size={12} color="#FCD34D" />
                          <Text className="text-xs text-gray-600 ml-1 font-medium">
                            {product.ratings || "4.5"} (
                            {product.reviews?.length || "1"})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between min-h-[24px]">
                      <View className="flex-row gap-2">
                        <Text
                          className="text-base text-gray-900"
                          style={{
                            fontfamily: "Inter-SemiBold",
                            fontWeight:
                              Platform.OS === "android" ? "600" : "normal",
                          }}
                        >
                          ${product?.sale_price}
                        </Text>
                        <Text className="text-sm text-gray-400 line-through">
                          ${product?.regular_price}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
          {/*Add some padding at the end*/}
          <View className="w-4" />
        </View>
      </ScrollView>
    </View>
  );
}
