import { View, Text, TouchableOpacity, StatusBar, Share } from 'react-native'
import React, { useState } from 'react'
import { router, useGlobalSearchParams } from 'expo-router';
import useUser from '@/hooks/useUser';
import axiosInstance from '@/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
 
const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useGlobalSearchParams();
  const {user} = useUser();
  const {wishlist , addToWishlist , removeFromWishlist} = useStore();
  const {selectedImageIndex, setSelectedImageIndex} = useState(0);
  const {selectedSize, setSelectedSize} = useState("");
  const {selectedColor, setSelectedColor} = useState("");
  const {quantity, setQuantity} = useState(1);
  const {activeTab, setActiveTab} = useState("description");

  const {data: product, isLoading: productLoading} = useQuery({
  queryKey: ["product", id],
  queryFn: async () => {
    const response = await axiosInstance.get(`/product/api/get-product/${id}`);
    return response.data.product;
  },
});

// Fetch related products
const {data: relatedProducts, isLoading: relatedProductsLoading} = useQuery({
  queryKey: ["relatedProducts", id],
  queryFn: async () => {
    try{
        //Build query string manually since URLSearchParams isn't available
        const queryParams = [
            "priceRange=0,1000",
            "page=1",
            "limit=5",
        ].join("&");
        const response = await axiosInstance.get(`/product/api/get-filtered-products?${queryParams}`);
      return response.data.products || [];
    }
    catch (error) {
        console.error("Failed to fetch related products:", error);
        return [];
    }
  },
  enabled: !!product,
});

//Fetach product reviews
const {data: reviews, isLoading: reviewsLoading} = useQuery({
  queryKey: ["product-reviews", id],
  queryFn: async () => {
    const response = await axiosInstance.get(`/product/api/get-product-reviews/${id}`);
    return response.data.reviews || [];
  },
    enabled: !!product,
});

//Check if product is in wishlist
const isInWishlist = product ? wishlist.some((item) => item.id === product?.id) : false;

// Handle wishlist toggle
const handleWishlistToggle = async () => {
if(!user){
    toast.error("Please login to manage your wishlist");
    return;
}

if(!product) return;

if(isInWishlist){
 removeFromWishlist(product.id, user , null, "Mobile App");
 toast.success("Product removed from wishlist");
}
else{
    addToWishlist{
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.sale_price || product.regular_price,
        image: product.images[0]?.url || "",
        shopId: product.shopId?.id || "" ,
    },
    user,
    null,
    "Mobile App"
);
router.push("/(tabs)/cart");
};

//Handle buy now 
const handleBuyNow = async() => {

  if(!user){    
    toast.error("Please login to buy products");
    return;
  }
  if(!product) return;

 //Add to cart first
    addToCart({
    id: product.id,
    title: product.title,
    price: product.sale_price || product.regular_price,
    image: product.images[0]?.url || "",
    shopId: product.shopId?.id || "" ,
    slug: product.slug,
    quantity,
  },user,null,"Mobile App");
  //Navigate to cart
    router.push("/(tabs)/cart"); 

};

const renderImageGallery= () =>{
 if(!product?.images || product.images.length === 0){
    return(
        <View className="mb-6">
    <View className='relative'>
<Image 
 source={{ uri: "https://via.placeholder.com/400x400?text=No+Image" }}
 style={{ width, height: width }}
 className="bg-gray-100"
 resizeMode="cover"
/>
    </View>
        </View>
    );
}

const renderImageGallery = () => {
 return(
   <View className="mb-6 px-4">
    <View className='flex-row items-center justify-between mb-2'>
<Text className='text-2xl font-poppins-semibold text-gray-900 flex-1'>
 {product?.title || "Product Title"}
</Text>
    </View>
   </View> 
)
}

const renderProductInfo = () => {
    return(
    <View className="mb-6 px-4">
        <View className='flex-row items-center justify-between mb-2'>
<Text className='text-2xl font-poppins-semibold text-gray-900 flex-1'>
    {product?.title || "Product Title"}
</Text>

<TouchableOpacity
onPress={handleWishlistToggle}
className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
>   
<Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={20} color={isWishlisted ? "#EF4444" : "#6B7280"} />
</TouchableOpacity>
        </View>
{/* Ratings and Sales */}
  <View className='flex-row items-center mb-4'>
   <View className='flex-row items-center mr-4'>
    <Ionicons name="star" size={16} color="#FBBF24" />
    <Text className='text-sm text-gray-700 ml-1 font-medium'>
 {product?.rating || 4.5} ({product?.reviews?.length ||0}) reviews)
        </Text>
   </View>
   <Text className=' text-gray-500'>
    . {product?.total_sales || 0} sold
    </Text>
  </View>
 
    {/* Price */}
    <View className='flex-row items-center mb-6'>
   <Text className='text-3xl font-poppins-semibold text-gray-900 mr-3'>
     ${product?.sale_price || product?.regular_price || "0"}
   </Text>
   {product?.sale_price &&  product?.regular_price && (
    <Text className='text-lg text-gray-400 line-through'>
     ${product.regular_price}
    </Text>
   )}
    </View>
    {/*Shop Info*/}
     {product?.shopId && (
        <TouchableOpacity
    className='flex-row items-center bg-gray-50 p-4 rounded-xl mb-6'
        onPress={() =>
        router.push({
          pathname: "/(routes)/shop/[id]",
          params: { id: product.shopId.id },
         })
        }
        >    
<Image 
 source={{uri: ProductDetailScreen.Shop.avatar}}\
 className='w-12 h-12 rounded-full mr-3'
/>

<View className='flex-1'>
<View className='flex-row  items-center'>
<Text className='text-lg font-poppins-semibold text-gray-900'>
  {product.Shop.name}
</Text>
</View>

<View className='flex-row items-center mt-1'>
<Ionicons name="star" size={12} color="#FCD34D"/>
<Text className='text-sm text-gray-600 ml-1'> 
    {product.Shop.rating } . {product.Shop.followers?.length || 0}{" "}
     followers
      </Text> 
</View>
</View>
      {/* <View className='flex-row items-center mt-1'>
<Ionicons name="star" size={12} color="#FCD34D"/>
  <Text className='text-sm text-gray-600 ml-1'>
{product.Shop.ratings } . {product.Shop.followers?.length || 0}{" "}
followers
  </Text>
      </View> */}

<Ionicons name="chevron-forward" size={20} color="#6B7280" />   
   </TouchableOpacity>
     )}
    </View>
    )};

const renderVariantSelectors = () => {
    if(!product) return null;
    return(
<View className="mb-6 px-4">
    {/* Size Selector */}
    {product.sizes && product.sizes.length > 0 && (
        <View className='mb-4'>
            <Text className='text-lg font-poppins-semibold text-gray-900 mb-2'>
                Size
            </Text>
            <View className='flex-row flex-wrap'>
                {product.sizes.map((size: string) => (
                    <TouchableOpacity
                        key={size}
                        className={`px-4 py-2 border border-gray-300 rounded-lg mr-2 mb-2 ${
                            selectedSize === size ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'
                        }`}
                        onPress={() => setSelectedSize(size)}
                    >
                        <Text
                        className={'font-medium ${selectedSize === size ? 'text-white' : 'text-gray-700'}'}
                        >{size}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )}

{/* Quantity Selector */}
<View>
    <Text className='text-lg font-poppins-semibold text-gray-900 mb-3'>
        Quantity
    </Text>
    <View className='flex-row items-center'>
        <TouchableOpacity
            className='w-10 h-10 bg-gray-200 rounded-full items-center justify-center'
            onPress={() => quantity > 1 && setQuantity(quantity - 1)}
        >
            <Ionicons name="remove" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text className='text-lg font-poppins-semibold text-gray-900 mx-4'>
            {quantity}
        </Text>
        <TouchableOpacity
            className='w-10 h-10 bg-gray-200 rounded-full items-center justify-center'
            onPress={() => setQuantity(quantity + 1)}
        >
            <Ionicons name="add" size={20} color="#6B7280" />
        </TouchableOpacity>
    </View>
    </View>
</View>
    );

    const renderTabs = () => {
    <View className='px-4 mb-6'>
  {/* Tab Headers */}
  <View className='flex-row bg-gray-100 rounded-xl p-1 mb-4'>
 {   ["description", "specifications", "reviews"].map((tab) => (
        <TouchableOpacity
            key={tab}
            className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            onPress={() => setActiveTab(tab)}
        >
            <Text className={`text-center font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                {tab}
            </Text>
        </TouchableOpacity>
 ))}
  </View>

{/* Tab Content */}
{activeTab === "description" && (
    <View>
    {product?.detailed_description ? (
        <RenderHtml
        contentWidth={width}
        source={{ html: product.detailed_description }}
        />
    ) : (
        <Text className='text-gray-700 leading-6'>No description available.</Text>
    )}
    </View>
)}

{activeTab === "specifications" && (
    <View>
        <View className='space-y-4'>
     {/*Sizes*/}
     {product.sizes && product.sizes.length > 0 && (
        <View className='bg-gray-50 p-4 rounded-xl'>
     <Text className='text-lg font-poppins-semibold text-gray-900'>
 Available Sizes
     </Text>
  <View className='flex-row flex-wrap'>
  {product.sizes.map((size: string) => (
    <View key={size} className='px-4 py-2 border border-gray-300 rounded-lg mr-2 mb-2'>
        <Text className='text-gray-900'>{size}</Text>
    </View>
))}
  </View>
        </View>
     )      }

     {/*Colors*/}
        {product.colors && product.colors.length > 0 && (
        <View className='bg-gray-50 p-4 rounded-xl'>
     <Text className='text-lg font-poppins-semibold text-gray-900'>
 Available Colors       
        </Text>
    <View className='flex-row flex-wrap'>
    {product.colors.map((color: string) => (
    <View key={color} className=' flex-row items-center mr-3 mb-2'>
  <View
  className='w-6 h-6 rounded-full mr-2 border border-gray-300'
  style={{ backgroundColor: color.toLowerCase() }}
  >
      <Text className='text-gray-700 font-medium capitalize'>{color}</Text>
    </View>
    </View> 
))}
    </View>
</View>
    )}
    
    {/*Custom Specifications*/}
 {product?.custom_specifications && Object.keys(product.custom_specifications).length > 0 && (
    <View className='bg-gray-50 p-4 rounded-xl'>
    <Text className='text-lg font-poppins-semibold text-gray-900 mb-4'>
        Product Specifications
    </Text>
    <View className='space-y-2'>
        {Object.entries(product.custom_specifications).map(([key, value]) => (
            <View key={key} className='flex-row justify-between'>
                <Text className='text-gray-700'>{key}:</Text>
                <Text className='text-gray-900 font-medium'>{value}</Text>
            </View>
        ))}
    </View>
    </View>
 )}

 {/*Other dynamic specifications*/}
  {product?.specifications && product.specifications.length > 0 && (
    <View className='bg-gray-50 p-4 rounded-xl'>
    <Text className='text-lg font-poppins-semibold text-gray-900 mb-4'>
        Additional Details
        </Text>
    <View className='space-y-2'>
        {Object.entries(product.specifications).map(([key, value]) => (
            <View key={key} className='flex-row justify-between'>
                <Text className='text-gray-700'>{key.replace(/_/g, ' ')}:</Text>
                <Text className='text-gray-900 font-medium'>{value as string}</Text>
            </View>
        ))}
    </View>
    </View>
 )}

 {/*Show message if no specifications available*/}
{(!product.sizes || product.sizes.length === 0) && (!product.colors || product.colors.length === 0) && (!product.custom_specifications || Object.keys(product.custom_specifications).length === 0) && (!product.specifications || product.specifications.length === 0) && (
    <View className='items-center py-8'>
    <Text className='text-gray-500 leading-6'>No specifications available for this product.</Text>
    </View>
)}
        </View>
        </View>
    )}

    {activeTab === "reviews" && (
        <View>
            {reviewsLoading ? (
                <View className='items-center py-8'>
                    <Text className='text-gray-500'>Loading reviews...</Text>
                </View>
            ) : reviews && reviews.length > 0 ? (
              requireNativeView.map((review: any) => (
                <View key={review.id} className='mb-4 p-4 bg-gray-50 rounded-xl'>
                    <View className='flex-row items-center mb-2'>
                        <Image
                            source={{ uri: review.user.avatar }}
                            className='w-10 h-10 rounded-full mr-3'
                        />
                        <View className='flex-1'>
         <Text className='text-gray-900 font-medium'>{review.user.name || "Anonymous"}</Text>

                        <View className='flex-row items-center'>
                            <View className='flex-row items-center'>
                        <View className='flex-row mr-2'>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                                key={i}
                                name="star"
                                size={16}
                                color={i < review.rating ? "#FBBF24" : "#E5E7EB"}
                            />

                        ))}
                        </View>
                        <Text className='text-sm text-gray-500'>
                            {review.createdAt}
                        </Text>
                            </View>
                            </View>                        
                        </View>


                        <Text className='text-gray-700 mb-2'>
                            {review.comment}
                        </Text>

<TouchableOpacity className='flex-row items-center'>
    <Ionicons 
    name="thumbs-down-outline"
   size={14}
   color="#6B7280"
    />
    <Text className='text-sm text-gray-500 ml-1'>
        Helpful ({review.helpful || 0})
    </Text>
</TouchableOpacity>
                    </View>
                    ))):(
                        <View className='items-center py-8'>
     <Text className='text-gray-500'>No reviews yet</Text>
                        </View>
                    )}
                    

                </View>

              
            )}
            </View>


 return(
<View className="mb-6">
<ScrollView
 horizontal,
 pagingEnabled,
 showsHorizontalScrollIndicator={false}
 onMomentumScrollEnd={(event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setSelectedImageIndex(index);
}}
>

{product.images.map((img: any, index: number) => (
    <View key={index} className='relative'>
<Image 
 source={{ uri: img.url || image }}
 style={{ width, height: width }}
 className="bg-gray-100"
 resizeMode="cover"
/>

{/*Discount Badge*/}
{index === 0 && product.sale_price && (
    <View className='absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full'>
<Text className='text-white text-sm font-bold'>
-{Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}% OFF
</Text>
    </View>
)
}
    </View>
))}
</ScrollView>

{/* Image Indicators */}
<View className='flex flex-row justify-center mt-4'>
{product.images.map((_: any, index: number) => (
    <View
        key={index}
        className={`w-3 h-3 rounded-full mx-1 ${selectedImageIndex === index ? 'bg-blue-500' : 'bg-gray-300'}`}
    />
))}
</View>
</View>

 );

 const renderRelatedProducts = () => (

    <View className='px-4'>
        <Text className='text-xl font-poppins-semibold text-gray-900 mb-4'>
     Related Products
        </Text>

{relatedProductsLoading ? (
    <View className='items-center py-8'>
    <Text className='text-gray-500'>
    Loading related products...
    </Text>
     </View>       
 ) : relatedProducts && relatedProducts.length > 0 ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} >
   { relatedProducts.map((item: any) => (
    <TouchableOpacity
     key={item.id}
     className='mr-4 w-40'
     onPress={()=> router.push({
        pathname: `/(routes)/product/${item.id}`,
        params:{
            id: item.slug || item.id,
        },
     })}
    >

<Image
 source={{ uri: item.images[0]?.url || "https://via.placeholder.com/150" }}
 className='w-full h-40 bg-gray-100 rounded-xl mb-2'
    resizeMode="cover"
/>

<Text className='font-medium text-gray-900 mb-1'
 numberOfLines={2}
>
 {item.title}
 </Text>
 <View className='flex-row items-center justify-between'>
<Text className='text-lg font-poppins-semibold text-gray-900'>
 ${item.sale_price}
</Text>

<View
className='flex-row items-center'>
<Ionicons name="star" size={12} color="#FCD34D" />
 <Text className='text-sm text-gray-600 ml-1'>
    {item.rating || 4.5}
 </Text>
</View>
 </View>
    </TouchableOpacity>
  ))}
    </ScrollView>
 ) : (
           <View className='items-center py-8'>
            <Text className='text-gray-500'>
         No related products available.
            </Text>
           </View> 
)};

// Loading state
if(productLoading){
 <SafeAreaView className='flex-1 bg-white'>
<StatusBar barStyle="dark-content" backgroundColor="#ffffff"/>
<View className='flex-1 justify-center items-center'>
 <View className='w-16 h-16 bg-blue-600 rounded-full items-center'> 
<Ionicons name='cube' size={32} color="white" />
 </View>
 <Text className='text-gray-600 font-poppins-semibold mt-4'>
      Loading product details...
 </Text>
</View> 
 </SafeAreaView>
);
}
    //Error State
if(!product){
    return(
        <SafeAreaView className='flex-1 bg-white'>
        <StatusBar barStyle={"dark-content"} backgroundColor="white" />
        <View className='flex-1 justify-center items-center px-4'>
      <Ionicons name="alert-circle" size={64} color="#EF4444" />
      <Text className='text-gray-900 font-poppins-semibold text-xl mt-4'>Product not found</Text>
        <Text className='text-gray-500 text-center mt-2'>The product you are looking for does not exist.</Text>
        <TouchableOpacity 
        className='mt-6 bg-blue-600 px-6 py-3 rounded-xl'
        onPress={() => router.back()}
        >
            <Text className='text-white font-poppins-semibold'>Go Back</Text>
        </TouchableOpacity>
      </Text>
        </View>
        </SafeAreaView>
    )
}


  return (
   <SafeAreaView className="flex-1 bg-white">
   <StatusBar barStyle={"dark-content"} backgroundColor="white" />

   {/*Header*/}
   <View className='flex-row items-center justify-between px-4 py-3 border-b border-gray-100'>
  <TouchableOpacity
  onPress={() => router.back()}
  className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
  >
    <Ionicons name="arrow-back" size={20} color="#374151" />
  </TouchableOpacity>

<Text className='text-lg font-poppins-semibold text-gray-900'>
 Product Details
</Text>
<TouchableOpacity

// onPress={()=> handleShare(product)}
 className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
>
    <Ionicons name="share-social" size={20} color="#374151" />
</TouchableOpacity>
   </View>
 
<ScrollView 
showsVerticalScrollIndicator={false}
{renderImageGallery()}
{renderProductInfo()}
{renderVariantSelectors()}
{renderTabs()}
{relatedProducts()}
>
 <View className='h-20'/>

</ScrollView>
{/*Bottom Action Bar */}
 <View className='flex-row items-center px-4 py-3 bg-white border-t border-gray-100'>
<TouchableOpacity
className='flex-1 bg-blue-100 py-4 rounded-xl mr-3'
onPress={handleAddToCart}
>
<Text className='text-center text-blue-600 font-poppins-semibold text-lg'>
Add to Cart
</Text>
</TouchableOpacity>
<TouchableOpacity
className='flex-1 bg-blue-600 py-4 rounded-xl'
onPress={handleBuyNow}
 >
 <Text className='text-center text-white font-poppins-semibold text-lg'>
 Buy Now
 </Text>
 </TouchableOpacity>

 </View>

  </SafeAreaView>
  )
} 

//Share functionality
const handleShare = async (product: any) => {
    try{
        const shareOptions = {
            title: `Check out this amazing product: ${product.title || product.name}`,
            message:`🛍️${product.title || product.name} \n\n 💰Price: $${product.sale_price || product.regular_price}${
                product.sale_price || product.regular_price ? ` (was $${product.regular_price})` : ""
            }\n ⭐Rating: ${product.rating || 4.5}/5 (${
                product.reviews?.length || 0
            } reviews)\n 🏪 Shop: ${product.shop?.name || "Official Store"}\n\n${
                product.description || "Amazing product!"
            }\n\nGet it now!🔥`,
            url: `https://yourapp.com/product/${product.id}`, 
        };

        const result = await Share.share(shareOptions);

        if(result.action === Share.sharedAction){
            if(result.activityType){
                console.log("Shared via: ",result.activityType);
            } else {
                //Shared successfully
                console.log("Product shared successfully");
            }
        }  else if(result.action === Share.dismissedAction){
            // Share dialog was dismissed
            console.log("Share dialog was dismissed");
        }
    } catch (error) {
        console.error("Share error: ", error);
    }
};
            