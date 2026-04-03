import React, { useState } from "react";
import { useStore } from "@/store";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, Image, TextInput } from "react-native";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function Cart() {
  const {cart, removeFromCart ,addToCart} = useStore();
  const [couponCode, setCouponCode] = useState("");
  const [shippingAddress] = useState("Home - Kuala Lumpur, Malaysia");
  const [paymentMethod] = useState("Online Payment");
 
  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId, null ,null, "Mobile App");
    showSuccessToast("Product removed from cart");
  };

  const handleUpdateQuantity = (product: any, newQuantity: number) => {
    if(newQuantity <= 0){
    handleRemoveFromCart(product.id);
    return;
    };

    //Remove the current item and add it back with the updated quantity
removeFromCart(product.id, null, null, "Mobile App");
addToCart({
  id: product.id,
  title: product.title,
  price: product.price,
  image: product.image,
  shopId: product.shopId,
  slug: product.slug,
  quantity: newQuantity,
}, null, null, "Mobile App");
  };

  const handleProductPress = (product: any) => {
    const productId = product.slug || product.id;
    router.push(`/product/${productId}`);
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }

const subtotal = calculateSubtotal();
const total=subtotal; // Add shipping, taxes, etc. here if needed

if(cart.length === 0){
  return(
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
 {/*Header*/}
 <View className="px-4 py-4  border-b border-gray-100">
            <Text className="text-2xl font-poppins-semibold text-gray-900">Shopping Cart</Text>
            <Text className="text-sm text-gray-500 font-poppins-semibold mt-1 "> Home . Cart</Text>
  </View>

{/*Empty State*/}
 <View className="flex-1 items-center justify-center px-4">
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="bag-outline" size={48} color="#9CA3AF" />
            </View>

    <Text className="text-xl text-gray-900 font-poppins-semibold mb-2">Your cart is empty</Text>
<Text className="text-gray-500 text-center font-poppins-semibold mb-8">
  Start shopping to add items to your cart 
</Text>
<TouchableOpacity
className="bg-blue-600 px-8 py-4 rounded-xl"
onPress={()=>router.push("/")}
>
    <Text className="text-white font-poppins-semibold text-lg">Start Shopping</Text>
</TouchableOpacity>
          </View>
    </SafeAreaView>
  )}
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/*Header*/}
      <View className="px-4 py-4  border-b border-gray-100">
            <Text className="text-2xl font-poppins-semibold text-gray-900">Shopping Cart</Text>
            <Text className="text-sm text-gray-500 font-poppins-semibold mt-1 "> Home . Cart</Text>
  </View>
  <ScrollView className="flex-1" showsVerticalScrollIndicator={false} >
  {/* Render cart items */}
  <View className="px-4 py-6">
  {cart.map((product,index) => (
     <View key={product.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-4 overflow-hidden">
      <View className="p-4">
        <View className="flex-row">
         {/*Product Image*/}
         <TouchableOpacity 
         className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden mr-4"
         onPress={() => handleProductPress(product)}
         >
          <Image
          source={{
            uri: product.image && product.image.trim() !== "" 
              ? product.image 
              : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=60"
          }}
          style={{ width: 80, height: 80 }}
          resizeMode="cover"
          />
         </TouchableOpacity>
  
  {/**Product Details */}
  <View className="flex-1">
    <TouchableOpacity onPress={() => handleProductPress(product)}>
      <Text className="text-lg font-poppins-semibold text-gray-900 mb-2" numberOfLines={2}>
        {product.title}
      </Text>
    </TouchableOpacity>
  
    {/*Price*/}
    <Text className="text-xl font-poppins-semibold text-blue-600 mb-4">
      ${product.price}
    </Text>
     
  {/*Quantity and Remove*/}
  <View className="flex-row items-center justify-between ">
{/*Quantity Selector*/}
<View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
<TouchableOpacity
onPress={()=>
  handleUpdateQuantity(
     product,
     (product.quantity || 1)-1
  )
}
className="w-8 h-8 bg-white rounded-full items-center justify-center"
>
<Ionicons name="remove" size={16} color="#6B7280" />
</TouchableOpacity>
<Text className="mx-4 text-lg font-poppins-semibold text-gray-900">
  {product.quantity || 1}
</Text>
<TouchableOpacity
onPress={()=>
  handleUpdateQuantity(
    product,
    (product.quantity || 1)+1
  )
}
className="w-8 h-8 bg-white rounded-full items-center justify-center"
>
<Ionicons name="add" size={16} color="#6B7280"/>
</TouchableOpacity>

</View>
  </View>

    {/*Actions Buttons*/}
    <View className="flex-row items-center justify-end">
      <TouchableOpacity
      className="px-4 py-3"
      onPress={()=> handleRemoveFromCart(product.id)}
      >
        <View className="flex-row items-center">
          <Ionicons name="close" size={16} color="#EF4444" />
          <Text className="text-red-500 font-poppins-semibold ml-1">Remove</Text>
        </View>
      </TouchableOpacity>
  
    </View>
  
  </View>
  
        </View>
  </View>
     </View>
  ))}
  </View>
  
{/*Order Summary*/}
<View className="px-4 pb-6">
  <View className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
<Text className="text-xl font-poppins-semibold text-gray-900 mb-6">
Order Summary
</Text>

{/*Subtotal*/}
<View className="flex-row justify-between items-center mb-4">
<Text className="text-gray-600 font-poppins-semibold">
Subtotal
</Text>
<Text className="text-lg font-poppins-semibold text-gray-900">
${subtotal.toFixed(2)}
</Text>
</View>

{/*Coupon Section*/}
  <View className="mb-6">
<Text className="text-lg font-poppins-semibold text-gray-900 mb-3">
  Have a Coupon?
</Text>
<View className="flex-row">
 <TextInput
 className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
 placeholder="Enter coupon code"
 value={couponCode}
 onChangeText={setCouponCode}
 />
 <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-lg ml-2">
  <Text className="text-white font-poppins-semibold">
    Apply
  </Text>
  </TouchableOpacity>
</View>
  </View>

{/*Shipping */}
  <View className="mb-6">
<Text className="text-lg font-poppins-semibold text-gray-900 mb-3">
  Select Shipping Address
</Text>

<TouchableOpacity className="flex-row items-center justify-between border border-gray-300 rounded-lg px-4 py-3">
  <Text className="text-gray-900 font-poppins-semibold">
   {shippingAddress}
  </Text>
  <Ionicons name="chevron-down" size={20} color="#6B7280" />
</TouchableOpacity>
  </View> 

{/*Payment Method*/}
<View className="mb-6">
<Text className="text-lg font-poppins-semibold text-gray-900 mb-3">
  Select Payment Method
</Text>
<TouchableOpacity className="border border-gray-300 rounded-lg ">
  <View className="flex-row items-center justify-between">
    <Text className="font-poppins-semibold text-gray-900">
     {paymentMethod}
    </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </View>
</TouchableOpacity>
</View>
 
 {/*Total*/}
<View className="flex-row justify-between items-center mb-6 pt-4 border-t-0">
<Text className="text-xl font-poppins-semibold text-gray-900">
Total
</Text>
<Text className="text-xl font-poppins-semibold text-gray-900"> 
  ${total.toFixed(2)}   
</Text>
</View>


{/*Proceed to Checkout*/}
<TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-xl">
  <Text className="text-white font-poppins-semibold text-center">Proceed to Checkout</Text>
</TouchableOpacity>
</View>
  </View>

  {/*Bottom Spacer*/}
  <View className="h-20" />
  </ScrollView>  
    </SafeAreaView>
  );
}
