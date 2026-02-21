import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";
import { useUser } from "../../../context/UserContext";
import {
  getCachedSubcategoryFlag,
  makeSubcategoryCacheKey,
  setCachedSubcategoryFlag,
} from "./subcategoryCache";
export default function CategoryNavigator({ route, navigation }) {
  const { mode: userMode } = useUser();
  const { categoryId, categoryName, mode: incomingMode } = route.params || {};
  const mode = incomingMode || userMode || "wholesale";

  const [loading, setLoading] = useState(true);
  const [hasSubcategories, setHasSubcategories] = useState(false);

  const checkSubcategories = async () => {
    try {
      const cacheKey = makeSubcategoryCacheKey(mode, categoryId);
      const cached = getCachedSubcategoryFlag(cacheKey);
      if (cached !== null) {
        setHasSubcategories(cached);
        setLoading(false);
        return;
      }
      const url =
        mode === "retail"
          ? `${API_BASE_URL}/api/retail/categories/${categoryId}/subcategories`
          : `${API_BASE_URL}/api/wholesale/categories/${categoryId}/subcategories`;
      let res;
      try {
        res = await axios.get(url);
      } catch (err) {
        if (mode === "retail" && err?.response?.status === 404) {
          // Fallback for older backend: use public subcategories with retail mode
          res = await axios.get(
            `${API_BASE_URL}/api/public/subcategories/${categoryId}`,
            { params: { mode: "retail" } }
          );
        } else if (mode !== "retail" && err?.response?.status === 404) {
          // Fallback for older backend: use public subcategories with wholesale mode
          res = await axios.get(
            `${API_BASE_URL}/api/public/subcategories/${categoryId}`,
            { params: { mode: "wholesale" } }
          );
        } else {
          throw err;
        }
      }
      const list = res.data?.data || res.data || [];
      const has = (list || []).length > 0;
      setHasSubcategories(has);
      setCachedSubcategoryFlag(cacheKey, has);
    } catch (err) {
      console.log("CHECK SUBCATEGORY ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[CATEGORY NAVIGATOR] incoming:", {
      categoryId,
      categoryName,
      mode,
    });
    checkSubcategories();
  }, [categoryId, categoryName, mode]);

  useEffect(() => {
    if (!loading) {
      if (hasSubcategories) {
        navigation.replace(mode === "retail" ? "RetailSubCategoryScreen" : "SubCategoryScreen", {
          categoryId,
          categoryName,
          mode,
        });
      } else {
        navigation.replace(mode === "retail" ? "RetailProductListScreen" : "ProductListScreen", {
          categoryId,
          categoryName,
          subcategoryId: null,
          mode,
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
