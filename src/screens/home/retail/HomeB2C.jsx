import React, { useEffect, useMemo, useRef, useState } from "react";
import SearchIcon from "../../../assets/icons/search.svg";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  FlatList,
  useWindowDimensions,
  Linking,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL, withBaseUrl } from "../../../config/api";
import { useUser } from "../../../context/UserContext";
import { useCart } from "../../../context/CartContext";
import { getProfile } from "../../../services/userService";
import { Fonts } from "../../styles/typography";
import MicIcon from "../../../assets/icons/mic.svg";
import UserIcon from "../../../assets/icons/user.svg";

const { width } = Dimensions.get("window");
const sliderWidth = width - 32;
const GRID_COLUMNS = 3;
const RETAIL_SECTION_COLUMNS = 3;
const GRID_SPACING = 12;
const GRID_HORIZONTAL_PADDING = 16;
const RETAIL_SECTION_HORIZONTAL_PADDING = 12;
const RETAIL_SECTION_SPACING = 8;
const placeholderImage = require("../../../assets/images/placeholder.png");
const normalizeId = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};
const normalizeSlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
const isInStock = (item) => {
  if (item?.stock === undefined || item?.stock === null || item?.stock === "") return true;
  return Number(item.stock) > 0;
};

export default function HomeB2C({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const stableTabBarHeight = tabBarHeight > 0 ? tabBarHeight : 70 + insets.bottom;
  const cartBarBottom = Math.max(stableTabBarHeight + 4, 0);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth =
    (screenWidth -
      GRID_HORIZONTAL_PADDING * 2 -
      GRID_SPACING * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS;
  const retailSectionCardWidth =
    (screenWidth -
      RETAIL_SECTION_HORIZONTAL_PADDING * 2 -
      RETAIL_SECTION_SPACING * (RETAIL_SECTION_COLUMNS - 1)) /
    RETAIL_SECTION_COLUMNS;
  const { userId } = useUser();
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();

  const [profileName, setProfileName] = useState("User");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [featuredSubcategories, setFeaturedSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [featuredCategoryIds, setFeaturedCategoryIds] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [retailBanner, setRetailBanner] = useState("");
  const [retailBannerConfig, setRetailBannerConfig] = useState(null);
  const [searchPlaceholdersRemote, setSearchPlaceholdersRemote] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [retailSectionBlocks, setRetailSectionBlocks] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [forceShowCartBar, setForceShowCartBar] = useState(false);
  const placeholderOpacity = useRef(new Animated.Value(1)).current;
  const placeholderTranslate = useRef(new Animated.Value(0)).current;

  const addressKey = useMemo(
    () => `selectedAddress_${userId || "guest"}`,
    [userId]
  );

  const getImageUri = (item) => {
    if (!item) return "";
    return (
      item.image ||
      item.imageUrl ||
      item.categoryImage ||
      item?.image?.url ||
      ""
    );
  };

  const getProductImageUri = (item) => {
    if (!item) return "";
    return (
      item.image ||
      item.thumbnail ||
      item.imageUrl ||
      item?.images?.[0] ||
      item?.thumbnails?.[0] ||
      ""
    );
  };

  const pickNumber = (...values) => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (
        typeof value === "string" &&
        value.trim() &&
        Number.isFinite(Number(value))
      ) {
        return Number(value);
      }
    }
    return 0;
  };

  const getPrices = (item) => {
    const sale = pickNumber(
      item?.discountPrice,
      item?.salePrice,
      item?.sellingPrice,
      item?.retailPrice,
      item?.price,
      item?.moqPrice,
      item?.mrp,
      item?.oldPrice
    );
    const mrp = pickNumber(
      item?.mrp,
      item?.oldPrice,
      item?.retailMrp,
      item?.price
    );
    return { sale, mrp: mrp > sale ? mrp : null };
  };

  const formatPrice = (value) =>
    `\u20B9${(Number(value) || 0).toLocaleString("en-IN")}`;
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cartItems]
  );
  const showCartBar = forceShowCartBar || totalItems > 0;
  const cartLabel = totalItems === 1 ? "item" : "items";
  const cartPreview = useMemo(
    () => cartItems.filter((item) => item?.image).slice(0, 3),
    [cartItems]
  );
  const getCartImage = (item) => {
    if (!item) return placeholderImage;
    if (typeof item.image === "string") {
      const trimmed = item.image.trim();
      if (trimmed && !trimmed.toLowerCase().includes("placeholder")) {
        return { uri: withBaseUrl(trimmed) };
      }
    }
    return item.image || placeholderImage;
  };
  const cartMap = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const key = normalizeId(item?.id);
      if (!key) return;
      map[key] = item;
    });
    return map;
  }, [cartItems]);

  const formatAddress = (addr) => {
    if (!addr) return "Add delivery location";
    const city = addr.city || addr.state || "";
    const pin = addr.pincode ? `${addr.pincode}` : "";
    return [city, pin].filter(Boolean).join(" - ");
  };
  const buildRetailSectionBlocks = async (section, allSubsData, categoriesData) => {
    if (!section?.enabled) return [];

    const selectedCategoryIds = Array.isArray(section?.categoryIds)
      ? section.categoryIds.map((item) => item?._id || item).filter(Boolean)
      : [];
    const selectedSubcategoryIds = Array.isArray(section?.subcategoryIds)
      ? section.subcategoryIds.map((item) => item?._id || item).filter(Boolean)
      : [];
    const fallbackCategoryId = section?.categoryId?._id || section?.categoryId || "";
    const fallbackSubcategoryId = section?.subcategoryId?._id || section?.subcategoryId || "";

    const categorySourceIds = selectedCategoryIds.length
      ? selectedCategoryIds
      : fallbackCategoryId
      ? [fallbackCategoryId]
      : [];
    const subcategorySourceIds = selectedSubcategoryIds.length
      ? selectedSubcategoryIds
      : fallbackSubcategoryId
      ? [fallbackSubcategoryId]
      : [];

    const requests = [
      ...categorySourceIds.map((id) => ({ type: "category", id })),
      ...subcategorySourceIds.map((id) => ({ type: "subcategory", id })),
    ];

    if (!requests.length) return [];

    const getTitle = (type, id) => {
      if (type === "subcategory") {
        const fromSection = (section?.subcategoryIds || []).find(
          (item) => (item?._id || item) === id
        );
        if (fromSection?.name) return fromSection.name;
        const fromAll = (allSubsData || []).find((item) => item?._id === id);
        return fromAll?.name || "Featured Products";
      }

      const fromSection = (section?.categoryIds || []).find(
        (item) => (item?._id || item) === id
      );
      if (fromSection?.name) return fromSection.name;
      const fromAll = (categoriesData || []).find((item) => item?._id === id);
      return fromAll?.name || "Featured Products";
    };

    const responses = await Promise.all(
      requests.map((reqItem) =>
        axios.get(
          reqItem.type === "subcategory"
            ? `${API_BASE_URL}/api/retail/products/subcategory/${reqItem.id}`
            : `${API_BASE_URL}/api/retail/products/category/${reqItem.id}`,
          { params: { mode: "retail" } }
        )
      )
    );

    const blocks = responses.map((res, index) => {
      const source = requests[index];
      const sourceId = source.id;
      const incoming = res?.data?.data || res?.data || [];
      const list = Array.isArray(incoming) ? incoming : [];
      const sorted = [...list].sort((a, b) => {
        const pa = Number(a?.position);
        const pb = Number(b?.position);
        const aOk = Number.isFinite(pa);
        const bOk = Number.isFinite(pb);
        if (aOk && bOk) return pa - pb;
        if (aOk) return -1;
        if (bOk) return 1;
        return 0;
      });
      const limit = Math.max(1, Number(section?.limit) || 6);
      const limited = sorted.slice(0, limit);
      const subObj = (allSubsData || []).find((item) => item?._id === sourceId);
      const parentCategoryId =
        source.type === "subcategory"
          ? subObj?.categoryId?._id || subObj?.categoryId || null
          : sourceId;

      return {
        id: sourceId,
        sourceType: source.type,
        title: getTitle(source.type, sourceId),
        categoryId: parentCategoryId,
        subcategoryId: source.type === "subcategory" ? sourceId : null,
        products: limited,
      };
    });

    return blocks.filter((item) => item.products.length > 0);
  };

  /* ------------------ DATA ------------------ */

  useEffect(() => {
    if (userId) {
      getProfile(userId).then((res) => {
        const name =
          res?.data?.registration?.ownerDetails?.firstName ||
          res?.data?.user?.name;
        if (name) setProfileName(name);
      });
    }
  }, [userId]);

  useEffect(() => {
    AsyncStorage.getItem(addressKey).then((data) => {
      if (data) setSelectedAddress(JSON.parse(data));
    });
  }, [addressKey]);

  useEffect(() => {
    let isActive = true;

    const loadHomeData = async () => {
      const [categoriesRes, allSubcategoriesRes, slidersRes, homeLayoutRes, bestsellersRes] =
        await Promise.allSettled([
          axios.get(`${API_BASE_URL}/api/retail/categories`),
          axios.get(`${API_BASE_URL}/api/retail/subcategories`, {
            params: { mode: "retail" },
          }),
          axios.get(`${API_BASE_URL}/api/sliders`, { params: { mode: "retail" } }),
          axios.get(`${API_BASE_URL}/api/home-layout`),
          axios.get(`${API_BASE_URL}/api/retail/products/bestsellers`, {
            params: { mode: "retail" },
          }),
        ]);

      const categoriesData =
        categoriesRes.status === "fulfilled"
          ? categoriesRes.value?.data?.data || []
          : [];
      const allSubcategoriesData =
        allSubcategoriesRes.status === "fulfilled"
          ? allSubcategoriesRes.value?.data?.data || []
          : [];
      const slidersData =
        slidersRes.status === "fulfilled" ? slidersRes.value?.data || [] : [];
      const layoutData =
        homeLayoutRes.status === "fulfilled" ? homeLayoutRes.value?.data || {} : {};
      const bestsellersData =
        bestsellersRes.status === "fulfilled"
          ? bestsellersRes.value?.data?.data || []
          : [];

      const featuredSubcategoryIds = (layoutData?.featuredSubcategories?.items || [])
        .map((item) => item?.subcategoryId?._id || item?.subcategoryId || item)
        .filter(Boolean);
      const featuredCategoryIdsData = (layoutData?.featuredCategories?.items || [])
        .map((item) => item?.categoryId?._id || item?.categoryId || item)
        .filter(Boolean);

      const sectionConfig = layoutData?.retailProductSection || null;

      if (!isActive) return;

      setCategories(categoriesData);
      setAllSubcategories(allSubcategoriesData);
      setSliders(slidersData);
      setFeaturedSubcategories(featuredSubcategoryIds);
      setFeaturedCategoryIds(featuredCategoryIdsData);
      setSearchPlaceholdersRemote(layoutData?.searchPlaceholders || []);
      setRetailBannerConfig(layoutData?.retailBanner || null);
      setRetailBanner(layoutData?.retailBanner?.image || "");
      setBestsellers(bestsellersData);

      const [firstCategorySubcategoriesResult, sectionBlocksResult] = await Promise.all([
        (async () => {
          if (featuredSubcategoryIds.length || !categoriesData.length) return [];
          try {
            const subRes = await axios.get(
              `${API_BASE_URL}/api/retail/categories/${categoriesData[0]._id}/subcategories`
            );
            return subRes?.data?.data || [];
          } catch {
            return [];
          }
        })(),
        (async () => {
          try {
            return await buildRetailSectionBlocks(
              sectionConfig,
              allSubcategoriesData,
              categoriesData
            );
          } catch {
            return [];
          }
        })(),
      ]);

      if (!isActive) return;
      setSubcategories(firstCategorySubcategoriesResult);
      setRetailSectionBlocks(sectionBlocksResult);
    };

    loadHomeData();

    return () => {
      isActive = false;
    };
  }, []);

  const featuredList = useMemo(() => {
    if (!featuredSubcategories.length) return subcategories;
    const byId = new Map(
      (allSubcategories || []).map((item) => [item._id, item])
    );
    const ordered = featuredSubcategories
      .map((id) => byId.get(id))
      .filter(Boolean);
    return ordered.length ? ordered : subcategories;
  }, [featuredSubcategories, allSubcategories, subcategories]);

  const featuredCategories = useMemo(() => {
    if (!featuredCategoryIds.length) return categories;
    const byId = new Map((categories || []).map((item) => [item._id, item]));
    const ordered = featuredCategoryIds
      .map((id) => byId.get(id))
      .filter(Boolean);
    return ordered.length ? ordered : categories;
  }, [featuredCategoryIds, categories]);

  const handleRetailSectionSeeAll = (block) => {
    if (!block) return;

    if (block.sourceType === "subcategory" && block.subcategoryId) {
      navigation.navigate("RetailProductListScreen", {
        categoryId: block.categoryId || null,
        categoryName: block.title || "Featured Products",
        subcategoryId: block.subcategoryId,
      });
      return;
    }

    if (block.categoryId) {
      navigation.navigate("RetailProductListScreen", {
        categoryId: block.categoryId,
        categoryName: block.title || "Featured Products",
        subcategoryId: null,
      });
    }
  };

  const handleRetailBannerPress = () => {
    const sourceType = retailBannerConfig?.sourceType || "none";
    const categoryId =
      retailBannerConfig?.categoryId?._id || retailBannerConfig?.categoryId || "";
    const subcategoryId =
      retailBannerConfig?.subcategoryId?._id || retailBannerConfig?.subcategoryId || "";

    if (sourceType === "subcategory" && subcategoryId) {
      const targetSubcategory = (allSubcategories || []).find(
        (item) => item?._id === subcategoryId
      );
      const parentCategoryId =
        targetSubcategory?.categoryId?._id || targetSubcategory?.categoryId || categoryId || null;
      navigation.navigate("RetailProductListScreen", {
        categoryId: parentCategoryId,
        categoryName: targetSubcategory?.name || "Products",
        subcategoryId,
      });
      return;
    }

    if (sourceType === "category" && categoryId) {
      const targetCategory = (categories || []).find((item) => item?._id === categoryId);
      navigation.navigate("RetailSubCategoryScreen", {
        categoryId,
        categoryName: targetCategory?.name || "Category",
      });
      return;
    }

    if (!retailSectionBlocks.length) return;
    handleRetailSectionSeeAll(retailSectionBlocks[0]);
  };

  const handleSliderPress = async (slide) => {
    const rawLink = String(slide?.redirectLink || "").trim();
    if (!rawLink) return;

    if (/^(https?:\/\/|tel:|mailto:|whatsapp:)/i.test(rawLink)) {
      try {
        await Linking.openURL(rawLink);
      } catch {
        Alert.alert("Invalid link", "This banner link could not be opened.");
      }
      return;
    }

    const path = rawLink.startsWith("/") ? rawLink.slice(1) : rawLink;
    const parts = path.split("/").filter(Boolean);
    const resource = String(parts[0] || "").toLowerCase();
    const identifier = decodeURIComponent(parts[1] || "");

    if (resource === "search") {
      navigation.navigate("Search");
      return;
    }

    if (resource === "product" && identifier) {
      navigation.navigate("RetailProductDetail", {
        productId: identifier,
        mode: "retail",
      });
      return;
    }

    if (resource === "category" && identifier) {
      const targetCategory = (categories || []).find(
        (item) =>
          item?._id === identifier ||
          normalizeSlug(item?.name) === normalizeSlug(identifier)
      );
      if (targetCategory?._id) {
        navigation.navigate("RetailSubCategoryScreen", {
          categoryId: targetCategory._id,
          categoryName: targetCategory?.name || "Category",
        });
        return;
      }
    }

    if (resource === "subcategory" && identifier) {
      const targetSubcategory = (allSubcategories || []).find(
        (item) =>
          item?._id === identifier ||
          normalizeSlug(item?.name) === normalizeSlug(identifier)
      );
      if (targetSubcategory?._id) {
        const parentCategoryId =
          targetSubcategory?.categoryId?._id ||
          targetSubcategory?.categoryId ||
          null;
        navigation.navigate("RetailProductListScreen", {
          categoryId: parentCategoryId,
          categoryName: targetSubcategory?.name || "Products",
          subcategoryId: targetSubcategory._id,
        });
        return;
      }
    }

    Alert.alert("Unavailable", "This banner link is not configured correctly.");
  };

  const handleAddToCart = (item, salePrice) => {
    const id = normalizeId(item?._id || item?.id);
    if (!id) return;
    setForceShowCartBar(true);
    addToCart({
      ...item,
      id,
      mode: "retail",
      price: Number.isFinite(Number(salePrice))
        ? Number(salePrice)
        : getPrices(item).sale,
      qty: Math.max(Number(item?.moq) || 0, 1),
    });
  };

  useEffect(() => {
    if (totalItems === 0) setForceShowCartBar(false);
  }, [totalItems]);

  /* ------------------ UI ------------------ */
  const searchPlaceholders = useMemo(() => {
    if (searchPlaceholdersRemote.length) return searchPlaceholdersRemote;
    return ["Onion Makhana", "Apple", "Cashew Anardana"];
  }, [searchPlaceholdersRemote]);

  useEffect(() => {
    let isActive = true;
    let timeoutId;

    const cycle = () => {
      if (!isActive) return;
      Animated.parallel([
        Animated.timing(placeholderOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(placeholderTranslate, {
          toValue: -6,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isActive) return;
        placeholderTranslate.setValue(6);
        setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(placeholderOpacity, {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(placeholderTranslate, {
              toValue: 0,
              duration: 260,
              useNativeDriver: true,
            }),
          ]).start(() => {
            timeoutId = setTimeout(cycle, 1800);
          });
        });
      });
    };

    timeoutId = setTimeout(cycle, 1800);
    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [placeholderOpacity, placeholderTranslate, searchPlaceholders.length]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          showCartBar && styles.contentContainerWithCartBar,
        ]}
      >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.navigate("HomeTabs", { screen: "Profile" })}
            style={styles.profileBtn}
          >
            <UserIcon width={24} height={24} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.helloText}>Hello {profileName}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddressBook")}
            >
              <Text style={styles.locationText}>
                {formatAddress(selectedAddress)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <TouchableOpacity
            style={styles.searchTap}
            activeOpacity={1}
            onPress={() => navigation.navigate("Search")}
          >
            <Animated.Text
              style={[
                styles.searchPlaceholder,
                {
                  opacity: placeholderOpacity,
                  transform: [{ translateY: placeholderTranslate }],
                },
              ]}
            >
              {`Search "${searchPlaceholders[placeholderIndex]}"`}
            </Animated.Text>
          </TouchableOpacity>
          <View style={styles.searchActions}>
            <TouchableOpacity
              style={styles.micBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Search")}
            >
              <SearchIcon width={18} height={18} style={styles.searchIcon} />
            </TouchableOpacity>
            <View style={styles.searchDivider} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Search", { autoStartVoice: true })}
              style={styles.micBtn}
            >
              <MicIcon width={18} height={18} fill="#5A5A5A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* SUB CATEGORIES (ROUND ICONS) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roundCatRow}
      >
        {featuredList.map((item) => {
          const categoryId =
            typeof item?.categoryId === "object"
              ? item?.categoryId?._id
              : item?.categoryId;
          const categoryName =
            typeof item?.categoryId === "object"
              ? item?.categoryId?.name
              : categories[0]?.name;
          return (
            <TouchableOpacity
              key={item._id}
              style={styles.roundCat}
              onPress={() =>
                navigation.navigate("RetailProductListScreen", {
                  categoryId: categoryId || categories[0]?._id,
                  categoryName: categoryName || categories[0]?.name,
                  subcategoryId: item._id,
                })
              }
            >
              <Image
                source={{
                  uri: withBaseUrl(getImageUri(item)),
                }}
                style={styles.roundCatImg}
              />
              <Text style={styles.roundCatText} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

          {/* SLIDERS */}
          {sliders.length > 0 && (
            <View style={styles.sliderWrap}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) =>
                  setActiveSlide(
                    Math.round(e.nativeEvent.contentOffset.x / sliderWidth)
                  )
                }
                scrollEventThrottle={16}
              >
                {sliders.map((slide) => (
                  <TouchableOpacity
                    key={slide._id}
                    activeOpacity={0.9}
                    onPress={() => handleSliderPress(slide)}
                  >
                    <Image
                      source={{ uri: withBaseUrl(slide.image) }}
                      style={styles.banner}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.dots}>
                {sliders.map((_, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[styles.dot, i === activeSlide && styles.dotActive]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* SHOP BY CATEGORY */}
          <Text style={styles.sectionTitle}>Shop by categories</Text>
          <FlatList
            data={featuredCategories}
            keyExtractor={(item) => item._id}
            numColumns={GRID_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={styles.categoryGrid}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  {
                    width: cardWidth,
                    marginRight: index % GRID_COLUMNS === GRID_COLUMNS - 1 ? 0 : GRID_SPACING,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("RetailSubCategoryScreen", {
                    categoryId: item._id,
                    categoryName: item.name,
                  })
                }
              >
                <Image
                  source={{ uri: withBaseUrl(getImageUri(item)) }}
                  style={styles.categoryImg}
                />
                <Text
                  style={[Fonts.bodyBold, styles.categoryText]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />

          {!!bestsellers.length && (
            <>
              <Text style={styles.sectionTitle}>Bestsellers</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bestSellerRow}
              >
                {bestsellers.map((item) => {
                  const { sale, mrp } = getPrices(item);
                  const productId = normalizeId(item?._id || item?.id);
                  const cartEntry = cartMap[productId];
                  const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
                  const outOfStock = !isInStock(item);
                  return (
                    <View key={productId} style={styles.bestSellerCard}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                          navigation.navigate("RetailProductDetail", {
                            productId: item?._id || item?.id,
                          })
                        }
                      >
                        <Image
                          source={{
                            uri: withBaseUrl(getProductImageUri(item)),
                          }}
                          style={styles.bestSellerImg}
                        />
                        <Text style={styles.bestSellerName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.bestSellerUnit}>
                          {item.weight || " "}
                        </Text>
                        <View style={styles.bestSellerPriceRow}>
                          <Text style={styles.bestSellerPrice}>{formatPrice(sale)}</Text>
                          {!!mrp && (
                            <Text style={styles.bestSellerMrp}>{formatPrice(mrp)}</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {outOfStock ? (
                        <View style={[styles.retailProductAddBtn, styles.outOfStockBtn]}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      ) : cartEntry ? (
                        <View
                          style={[
                            styles.retailProductCounter,
                            styles.bestSellerCounterSpacing,
                          ]}
                        >
                          <TouchableOpacity
                            onPressIn={() => {
                              setForceShowCartBar(true);
                              decrementItem(cartEntry.id, "retail");
                            }}
                            delayPressIn={0}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.75}
                            disabled={!canDecrement}
                            style={[
                              styles.retailProductCounterBtn,
                              !canDecrement && styles.retailProductCounterBtnDisabled,
                            ]}
                          >
                            <Text style={styles.retailProductCounterBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.retailProductCounterValue}>
                            {cartEntry.qty}
                          </Text>
                          <TouchableOpacity
                            onPressIn={() => {
                              setForceShowCartBar(true);
                              incrementItem(cartEntry.id, "retail");
                            }}
                            delayPressIn={0}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.75}
                            style={styles.retailProductCounterBtn}
                          >
                            <Text style={styles.retailProductCounterBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.retailProductAddBtn, styles.bestSellerAddBtn]}
                          delayPressIn={0}
                          onPress={() => handleAddToCart(item, sale)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={styles.retailProductAddBtnText}
                            numberOfLines={1}
                            allowFontScaling={false}
                          >
                            Add to Cart
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          )}

          {!!retailBanner && (
            <TouchableOpacity
              style={styles.edgeBannerWrap}
              activeOpacity={0.9}
              onPress={handleRetailBannerPress}
            >
              <Image
                source={{ uri: withBaseUrl(retailBanner) }}
                style={styles.edgeBanner}
              />
            </TouchableOpacity>
          )}

      {!!retailSectionBlocks.length &&
        retailSectionBlocks.map((block) => (
              <View key={`${block.sourceType}-${block.id}`} style={styles.retailSectionWrap}>
                <Text style={styles.sectionTitle}>{block.title || "Featured Products"}</Text>
                <FlatList
                  data={block.products}
                  keyExtractor={(item) => item._id || item.id}
                  numColumns={RETAIL_SECTION_COLUMNS}
                  scrollEnabled={false}
                  contentContainerStyle={styles.retailProductGrid}
                  renderItem={({ item, index }) => {
                    const { sale, mrp } = getPrices(item);
                    const productId = normalizeId(item?._id || item?.id);
                    const cartEntry = cartMap[productId];
                    const canDecrement = (Number(cartEntry?.qty) || 0) > 0;
                    const outOfStock = !isInStock(item);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.retailProductCard,
                          {
                            width: retailSectionCardWidth,
                            marginRight:
                              index % RETAIL_SECTION_COLUMNS === RETAIL_SECTION_COLUMNS - 1
                                ? 0
                                : RETAIL_SECTION_SPACING,
                          },
                        ]}
                        activeOpacity={0.9}
                        onPress={() =>
                          navigation.navigate("RetailProductDetail", {
                            product: item,
                            productId,
                            mode: "retail",
                          })
                        }
                      >
                        <Image
                          source={
                            getProductImageUri(item)
                              ? { uri: withBaseUrl(getProductImageUri(item)) }
                              : placeholderImage
                          }
                          style={styles.retailProductImage}
                        />

                        <Text style={styles.retailProductName} numberOfLines={2}>
                          {item?.name || ""}
                        </Text>

                        <Text style={styles.retailProductWeight}>
                          {item?.weight || "1 Kg"}
                        </Text>

                        <View style={styles.retailProductPriceRow}>
                          <Text style={styles.retailProductPrice}>
                            {formatPrice(sale)}
                          </Text>
                          {mrp && (
                            <Text style={styles.retailProductMrp}>{formatPrice(mrp)}</Text>
                          )}
                        </View>

                        {outOfStock ? (
                          <View style={[styles.retailProductAddBtn, styles.retailSectionAddBtn, styles.outOfStockBtn]}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                          </View>
                        ) : cartEntry ? (
                          <View style={styles.retailProductCounter}>
                            <TouchableOpacity
                              onPressIn={(event) => {
                                event?.stopPropagation?.();
                                setForceShowCartBar(true);
                                decrementItem(cartEntry.id, "retail");
                              }}
                              delayPressIn={0}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.75}
                              disabled={!canDecrement}
                              style={[
                                styles.retailProductCounterBtn,
                                !canDecrement && styles.retailProductCounterBtnDisabled,
                              ]}
                            >
                              <Text style={styles.retailProductCounterBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.retailProductCounterValue}>
                              {cartEntry.qty}
                            </Text>
                            <TouchableOpacity
                              onPressIn={(event) => {
                                event?.stopPropagation?.();
                                setForceShowCartBar(true);
                                incrementItem(cartEntry.id, "retail");
                              }}
                              delayPressIn={0}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              activeOpacity={0.75}
                              style={styles.retailProductCounterBtn}
                            >
                              <Text style={styles.retailProductCounterBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                        <TouchableOpacity
                          style={[styles.retailProductAddBtn, styles.retailSectionAddBtn]}
                          delayPressIn={0}
                          onPress={(event) => {
                            event?.stopPropagation?.();
                            handleAddToCart(item, sale);
                          }}
                          activeOpacity={0.75}
                        >
                            <Text style={styles.retailProductAddBtnText}>Add to Cart</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />

                <TouchableOpacity
                  style={styles.retailSeeAllBtn}
                  onPress={() => handleRetailSectionSeeAll(block)}
                >
                  <Text style={styles.retailSeeAllText}>See all Products</Text>
                  <Image
                    source={require("../../../assets/icons/arrow-right.png")}
                    style={styles.retailSeeAllIcon}
                  />
                </TouchableOpacity>
              </View>
            ))}
      </ScrollView>

      {showCartBar && (
        <View style={[styles.cartBarSafe, { bottom: cartBarBottom }]}>
          <TouchableOpacity
            style={styles.cartBar}
            onPress={() =>
              navigation.navigate("HomeTabs", {
                screen: "Cart",
                params: { mode: "retail" },
              })
            }
          >
            <View style={styles.cartThumbs}>
              {cartPreview.map((item, index) => (
                <View key={item.id || item._id || index} style={styles.thumbWrap}>
                  <Image source={getCartImage(item)} style={styles.thumbImg} />
                </View>
              ))}
            </View>
            <View style={styles.cartInfo}>
              <Text style={[Fonts.bodyBold, styles.cartTitle]}>View cart</Text>
              <Text style={[Fonts.body, styles.cartSubtitle]}>
                {totalItems} {cartLabel}
              </Text>
            </View>
            <Image
              source={require("../../../assets/icons/arrow-right.png")}
              style={styles.cartArrow}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f6f6" },
  container: { backgroundColor: "#f6f6f6" },
  contentContainer: { paddingBottom: 120 },
  contentContainerWithCartBar: { paddingBottom: 160 },

  header: {
    backgroundColor: "#FF2E2E",
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#B80000",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  helloText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  locationText: {
    color: "#FFE3E3",
    fontSize: 12,
  },

  searchBox: {
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    height: 44,
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
  },

  searchTap: { flex: 1, paddingRight: 6 },

  searchActions: { flexDirection: "row", alignItems: "center", gap: 6 },

  searchPlaceholder: {
    color: "#9A9A9A",
    fontSize: 13,
  },

  searchIcon: {
    width: 18,
    height: 18,
    tintColor: "#5A5A5A",
  },

  searchDivider: {
    width: 1,
    height: 22,
    backgroundColor: "#E6E6E6",
  },

  micBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  micIcon: {
    width: 18,
    height: 18,
    tintColor: "#5A5A5A",
    resizeMode: "contain",
  },

  roundCatRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },

  roundCat: {
    width: 72,
    alignItems: "center",
  },

  roundCatImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F3F3",
  },

  roundCatText: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },

  banner: {
    width: sliderWidth,
    height: 140,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },

  sliderWrap: { marginTop: 6 },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E2E2",
    marginHorizontal: 3,
  },

  dotActive: { backgroundColor: "#FF2E2E" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 16,
    marginVertical: 12,
  },

  categoryGrid: {
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    marginTop: 4,
  },

  categoryCard: {
    height: 146,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCDCDC",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: GRID_SPACING,
  },

  categoryImg: {
    width: 84,
    height: 84,
  },

  categoryText: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 6,
    lineHeight: 14,
    marginTop: 6,
    minHeight: 30,
  },

  bestSellerRow: {
    paddingHorizontal: 14,
    gap: 12,
  },

  bestSellerCard: {
    width: 155,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  bestSellerImg: {
    width: "100%",
    height: 64,
    borderRadius: 12,
    marginBottom: 6,
    resizeMode: "contain",
  },

  bestSellerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    minHeight: 28,
  },

  bestSellerUnit: {
    fontSize: 12,
    color: "#9A9A9A",
    marginTop: 2,
  },

  bestSellerPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },

  bestSellerPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },

  bestSellerMrp: {
    fontSize: 12,
    color: "#9A9A9A",
    textDecorationLine: "line-through",
  },

  bestSellerBtn: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#FF2E2E",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  bestSellerBtnText: {
    color: "#FF2E2E",
    fontSize: 12,
    fontWeight: "700",
  },
  bestSellerCounter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#FF2E2E",
    borderRadius: 10,
    minWidth: 110,
    height: 30,
    paddingHorizontal: 10,
    gap: 8,
  },
  bestSellerCounterBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  bestSellerCounterBtnDisabled: {
    opacity: 0.5,
  },
  bestSellerCounterBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
  },
  bestSellerCounterValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 16,
    textAlign: "center",
  },

  edgeBannerWrap: {
    marginTop: 14,
    marginHorizontal: 0,
  },

  edgeBanner: {
    width: "100%",
    height: Math.round(width * 0.7),
    resizeMode: "cover",
  },

  retailSectionWrap: {
    marginTop: 8,
    paddingHorizontal: RETAIL_SECTION_HORIZONTAL_PADDING,
  },

  retailProductGrid: {
    marginTop: 4,
    alignItems: "flex-start",
  },

  retailProductCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 12,
    padding: 8,
    height: 198,
    alignSelf: "flex-start",
    marginBottom: RETAIL_SECTION_SPACING,
  },

  retailProductImage: {
    width: "100%",
    height: 68,
    borderRadius: 8,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },

  retailProductName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 15,
    minHeight: 30,
  },

  retailProductWeight: {
    marginTop: 2,
    fontSize: 11,
    color: "#8E8E8E",
  },

  retailProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },

  retailProductPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },

  retailProductMrp: {
    fontSize: 10,
    color: "#A0A0A0",
    textDecorationLine: "line-through",
  },

  retailProductAddBtn: {
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1.4,
    borderColor: "#FF2E2E",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },

  retailProductAddBtnText: {
    color: "#FF2E2E",
    fontSize: 11,
    fontWeight: "700",
  },
  outOfStockBtn: {
    borderColor: "#BDBDBD",
    backgroundColor: "#F5F5F5",
  },
  outOfStockText: {
    color: "#757575",
    fontSize: 11,
    fontWeight: "700",
  },
  bestSellerAddBtn: {
    marginBottom: 6,
  },
  bestSellerCounterSpacing: {
    paddingHorizontal: 20,
    gap: 20,
  },
  retailSectionAddBtn: {
    marginBottom: 16,
  },
  retailProductCounter: {
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: "#FF2E2E",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    paddingHorizontal: 16,
    gap: 16,
  },
  retailProductCounterBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  retailProductCounterBtnDisabled: {
    opacity: 0.5,
  },
  retailProductCounterBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  retailProductCounterValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 14,
    textAlign: "center",
  },

  retailSeeAllBtn: {
    marginTop: 6,
    backgroundColor: "#FFD8D8",
    borderColor: "#FF2E2E",
    borderWidth: 1.2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    gap: 6,
  },

  retailSeeAllText: {
    color: "#FF0000",
    fontSize: 14,
    fontWeight: "800",
  },
  retailSeeAllIcon: {
    width: 14,
    height: 14,
    tintColor: "#FF0000",
    resizeMode: "contain",
  },

  cartBarSafe: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    paddingBottom: 0,
    zIndex: 20,
    elevation: 20,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FF2E2E",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cartThumbs: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  thumbWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    borderWidth: 2,
    borderColor: "#FF2E2E",
  },
  thumbImg: { width: 28, height: 28, borderRadius: 14, resizeMode: "contain" },
  cartInfo: { flex: 1 },
  cartTitle: { color: "#fff", fontSize: 15 },
  cartSubtitle: { color: "#E7F5E8", fontSize: 12, marginTop: 2 },
  cartArrow: { width: 18, height: 18, tintColor: "#fff", resizeMode: "contain" },

});
