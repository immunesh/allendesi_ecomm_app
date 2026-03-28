import { useEffect, useState } from "react";
import { getStoredItem, setStoredItem } from "@/utils/storage";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: {
    id: string;
    url: string;
    file_id: string;
  };
}

export default function useUser() {
  const [user, setUser] = useState<User | null>(null);

  //Retrieving the stored user data
  const getUserData = async () => {
    try {
      const userString = await getStoredItem("user");
      if (userString) {
        const user: User = JSON.parse(userString);
        setUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  };

  //Update user data (for avatar updates)
  const updateUserData = async (newUserData: User) => {
    try {
      await setStoredItem("user", JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  return { user, updateUserData };
}
