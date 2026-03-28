import React from "react";
import { StatusBar, Text, View, Image } from "react-native";
import { useStore } from "@/store";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

export default function Wishlist() {
  const {wishlist,removeFromWishlist,addToCart} = useStore();

  const handleRemoveFromWishlist = (productId:string) => {
    removeFromWishlist(productId,null,null,"Mobile App");
  };

  const handleAddToCart = (product:any) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      shopId: product.shopId,
      slug: product.slug,
      quantity: 1,
    },null,null,"Mobile App");
    router.push("/(tabs)/cart");
  };

  const handleProductPress = (product: any) => {
    router.push({
      pathname: "/(routes)/product/[id]",
      params: { id: product.slug }
    });
  };

     if(wishlist.length === 0){
      return(
        <SafeAreaView className="flex-1 bg-white">
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/*Header */}
          <View className="px-4 py-4  border-b border-gray-100">
            <Text className="text-2xl font-poppins-semibold text-gray-900">Wishlist</Text>
            <Text className="text-sm text-gray-500 font-poppins-semibold mt-1 "> Home . Wishlist</Text>
          </View>

    {/* Empty State*/}
    <View className="flex-1 items-center justify-center px-4">
     <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
     <Ionicons name="heart-outline" size={48} color="#9CA3AF" />  
    </View>
    <Text className="text-xl text-gray-900 font-poppins-semibold mb-2">Your wishlist is empty</Text>
    <Text className="text-gray-500 text-center font-poppins-semibold mb-8">
       Start adding products to your wishlist and they will appear here.
    </Text>

<TouchableOpacity 
className="bg-blue-600 px-8 py-4 rounded-xl"
onPress={()=>router.push("/(tabs)")}
>
    <Text className="text-white font-poppins-semibold text-lg">Start Shopping</Text>
    </TouchableOpacity>
    </View>
        </SafeAreaView>
      );
    
    }
  return (
<SafeAreaView className="flex-1 bg-white">
      
       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
         {/*Header */}
          <View className="px-4 py-4  border-b border-gray-100">
            <Text className="text-2xl font-poppins-semibold text-gray-900">Wishlist</Text>
            <Text className="text-sm text-gray-500 font-poppins-semibold mt-1 "> Home . Wishlist</Text>
          </View>

<ScrollView className="flex-1" showsVerticalScrollIndicator={false} >
{/* Render wishlist items */}
<View className="px-2 py-0">
{wishlist.map((product,index) => (
  <View key={product.id} className="flex-row bg-white rounded-2xl shadow-md border border-gray-100 mb-4 overflow-hidden items-center">
    <TouchableOpacity
      className="w-20 h-20 bg-gray-100 overflow-hidden rounded-lg ml-3"
      onPress={() => handleProductPress(product)}
    >
      <Image
        source={{
          uri: product.image && product.image.trim() !== ""
            ? product.image
            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60"
        }}
        style={{ width: 80, height: 80, marginLeft:10 ,borderRadius: 8 }}
        resizeMode="cover"
      />
    </TouchableOpacity>

    <View className="flex-1 px-3 py-2 justify-between">
      <View>
        <TouchableOpacity onPress={() => handleProductPress(product)}>
          <Text className="text-lg font-poppins-semibold text-gray-900" numberOfLines={2}>
            {product.title}
          </Text>
        </TouchableOpacity>

        <Text className="text-sm text-gray-500 mt-1 mb-2" numberOfLines={1}>
          Premium item
        </Text>

        <Text className="text-xl font-poppins-semibold text-blue-600">
          ${Number(product.price).toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity
          className="flex-1 bg-blue-600 px-4 py-2 rounded-xl mr-2"
          onPress={() => handleAddToCart(product)}
        >
          <Text className="text-white font-poppins-semibold text-sm text-center">Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-red-100 px-4 py-2 rounded-xl"
          onPress={() => handleRemoveFromWishlist(product.id)}
        >
          <Text className="text-red-500 font-poppins-semibold text-sm">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
))}
</View>

{/*Bottom Spacer*/}
<View className="h-20" />
</ScrollView>

   </SafeAreaView>
  );
}