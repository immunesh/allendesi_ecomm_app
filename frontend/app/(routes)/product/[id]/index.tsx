import React from 'react';
import {View, Text, TouchableOpacity, StatusBar, Dimensions, ScrollView, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useGlobalSearchParams, useRouter} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import axiosInstance from '@/utils/axiosInstance';

export default function ProductDetailScreen() {
  const router = useRouter();
  const {id} = useGlobalSearchParams();

  const {data: product, isLoading}: any = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/api/get-product/${id}`);
      return res.data.product;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center'>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className='flex-1 bg-white items-center justify-center'>
        <Text>Product not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-white'>
      <StatusBar barStyle='dark-content' backgroundColor='#fff' />
      <View className='flex-row items-center justify-between p-4 border-b border-gray-200'>
        <TouchableOpacity onPress={() => router.back()}>
          <Text>Back</Text>
        </TouchableOpacity>
        <Text className='font-bold text-lg'>Product Details</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView className='p-4'>
        <View className='items-center mb-4'>
          <Image
            source={{uri: product.images?.[0]?.url || 'https://via.placeholder.com/300'}}
            style={{width: 300, height: 300, borderRadius: 12}}
          />
        </View>
        <Text className='text-2xl font-bold mb-2'>{product.title || 'Untitled Product'}</Text>
        <Text className='text-lg text-gray-700 mb-3'>{`$${product.sale_price || product.regular_price || 0}`}</Text>
        <Text className='text-gray-600'>{product.description || 'No description available.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
