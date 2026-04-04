import { sendKafkaEvent } from '@/actions/track-user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from "zustand";
import {createJSONStorage,persist} from "zustand/middleware.js";


type Product ={
    id:string;
    slug:string;
    title:string;
    price:number;
    image:string;
    quantity?:number;
    shopId:string;
}

type Store ={
    cart:Product[];
    wishlist:Product[];

    addToCart: (
        product:Product,
        user:any,
        location:any,
        deviceInfo:any,
    ) => void;

    removeFromCart:(
        id:string,
        user:any,
        location:any,
        deviceInfo:any
    ) => void;
    clearCart: () =>void;
  
    addToWishlist:(
        product:Product,
        user:any,
        location:any,
        deviceInfo:any
    ) => void;

    removeFromWishlist:(
        id:string,
        user:any,
        location:any,
        deviceInfo:any
    ) => void;
};

export const useStore = create<Store>()(
  persist(
    (set,get)=>({
        cart:[],
        wishlist:[],
    


        //add to cart
        addToCart: (product,user,location,deviceInfo)=>{
            set((state) => {
                     const existing =state.cart?.find((item) => item.id === product.id);

                        if(existing){
                            return {
                                ...state,
                                cart: state.cart.map((item) =>
                                    item.id === product.id ? {...item, quantity: (item.quantity ?? 1) + 1} : item
                                ),
                            };
                        } 
                            return {
                            
                                            cart: [...state.cart, {...product, quantity: product?.quantity}],
                                        };
                                

                        });

                        //send event to kafka
                        if(user?.id && location && deviceInfo){
                        sendKafkaEvent({
                            userId:user.id,
                            action:"add_to_cart",
                            productId:product.id,
                            shopId:product.shopId,
                            device:deviceInfo || "Unknown",
                            country:location?.country || "Unknown",
                            city:location?.city || "Unknown",
                        })
            }},

    
        //remove from cart
        removeFromCart:(id,user,location,deviceInfo)=>{
            const removedItem = get().cart.find((item) => item.id === id);
            set((state) => ({
                ...state,
                cart: state.cart.filter((item) => item.id !== id),
            }));

//clear cart
clearCart: () =>{
    set({cart: []});
},

            //send event to kafka
            if(user?.id && location && deviceInfo){
                sendKafkaEvent({
                    userId:user?.id,
                    productId:removedItem?.id,
                    shopId:removedItem?.shopId,
                    action:"remove_from_cart",
                    device:deviceInfo || "Unknown",
                    country:location?.country || "Unknown",
                    city:location?.city || "Unknown",
                });
            }
        },
        
        //add to wishlist
        addToWishlist:(product,user,location,deviceInfo)=>{
            set((state) => {
                if(state.wishlist.find((item) => item.id === product.id)){
                    return state; // already in wishlist
                }
                return {
                    ...state,
                    wishlist: [...state.wishlist, product],
                };
            }); 

            //send event to kafka
            if(user?.id && location && deviceInfo){
                sendKafkaEvent({
                    userId:user?.id,
                    action:"add_to_wishlist",
                    productId:product?.id,
                    shopId:product?.shopId,
                    device:deviceInfo || "Unknown Device",
                    country:location?.country || "Unknown",
                    city:location?.city || "Unknown",
                });
            }
        },

        removeFromWishlist:(id,user,location,deviceInfo)=>{
            const removedItem = get().wishlist.find((item) => item.id === id);
            set((state) => ({
                ...state,
                wishlist: state.wishlist.filter((item) => item.id !== id),
            }));

            //send event to kafka
            if(user?.id && location && deviceInfo){
                sendKafkaEvent({
                    userId:user?.id,
                    action:"remove_from_wishlist",
                    productId:removedItem?.id,
                    shopId:removedItem?.shopId,
                    device:deviceInfo || "Unknown Device",
                    country:location?.country || "Unknown",
                    city:location?.city || "Unknown",
                });
            }
        },
    }),{
        name:"store-storage",
        storage:createJSONStorage(() => AsyncStorage),
    }
)
);  