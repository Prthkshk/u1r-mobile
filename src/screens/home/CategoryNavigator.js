import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function CategoryNavigator({ route, navigation }) {
  const { categoryId, categoryName } = route.params;

  const [loading, setLoading] = useState(true);
  const [hasSubcategories, setHasSubcategories] = useState(false);

  const checkSubcategories = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/public/subcategories/${categoryId}`
      );

      setHasSubcategories(res.data.length > 0);
    } catch (err) {
      console.log("CHECK SUBCATEGORY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubcategories();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (hasSubcategories) {
        navigation.replace("SubCategoryScreen", {
          categoryId,
          categoryName,
        });
      } else {
        navigation.replace("ProductListScreen", {
          categoryId,
          categoryName,
          subcategoryId: null,
        });
      }
    }
  }, [loading, hasSubcategories]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF2E2E" />
      </View>
    );
  }

  return null; // nothing needed here
}
