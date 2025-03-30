import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  Button,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import Modal from "react-native-modal";
import { BlurView } from "expo-blur";
import Entypo from "react-native-vector-icons/Entypo";

import ModalProductCategoryPicker from "./ModalProductCategoryPicker";
import ModalImagePicker from "../../components/ModalImagePicker";
import useAuthStore from '../../store/authStore';  // Correct path to your auth store
import { addOrUpdateProduct, deleteProduct } from "../../store/fridgeStore";

import {
  buttonColor,
  deleteButtonColor,
  backgroundColor,
  MainFont,
  MainFont_Bold,
  MainFont_Title,
  ReceiptFont,
  TextFontSize,
  SecondTitleFontSize,
  greyTextColor,
  blackTextColor,
} from "../../../assets/Styles/styleVariables";

import { categories } from "../../../assets/Variables/categories";
import { useFonts } from "expo-font";

// NEW IMPORTS FOR IMAGE UPLOAD
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../../firebaseConfig";

const { width, height } = Dimensions.get("window");
const isSmallScreen = height < 700;
const defaultCategory = { tagName: "Other", tagIcon: "❓", tagType: 1 };
const staticImages = [
  require("../../../assets/ProductImages/apple_test.png"),
  require("../../../assets/ProductImages/banana_test.png"),
  require("../../../assets/ProductImages/milk_test.png")
];

export default function ModalCreateProduct({
  isVisible,
  onClose,
  product,
  onChange,
  usedIngredients,
}) {
  const userId = useAuthStore((state) => state.user?.uid);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [amount, setAmount] = useState(1);
  const [notes, setNotes] = useState("");
  const [id, setId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [staticImagePath, setStaticImagePath] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    if (product && product.id !== undefined) {
      setName(product.name || "");
      setCategory(product.category || defaultCategory);
      setNotes(product.notes || "");
      setAmount(product.amount || 0);
      setImageUri(product.imageUri || null);
      setStaticImagePath(product.staticImagePath || null);
      setId(product.id || "");
      setIsCreatingNew(false);
    } else {
      resetForm();
    }
  }, [product]);

  const resetForm = () => {
    setName("");
    setCategory(defaultCategory);
    setAmount(1);
    setNotes("");
    setId("");
    setImageUri(null);
    setStaticImagePath(null);
    setIsCreatingNew(true);
  };

  const pickImageFromDevice = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storage = getStorage(app);
        const storageRef = ref(storage, `productImages/${new Date().getTime()}`);
        const metadata = {
          contentType: 'image/jpeg',
          cacheControl: 'public,max-age=86400',
        };
        await uploadBytes(storageRef, blob, metadata);
        const downloadUrl = await getDownloadURL(storageRef);
        setImageUri(downloadUrl);
        setStaticImagePath(null);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
    setIsImageModalVisible(false);
  };

  const handleStaticImageSelect = (path) => {
    setStaticImagePath(path);
    setImageUri(null);
    setIsImageModalVisible(false);
  };

  const handleCategorySelect = (selectedTag) => {
    setCategory(selectedTag);
  };

  const confirmDelete = (id) => {
    if (usedIngredients.includes(id)) {
      if (Platform.OS === "web") {
        window.alert("This product is used in a recipe or in the basket and cannot be deleted.");
      } else {
        Alert.alert(
          "This product is used in a recipe or in the basket and cannot be deleted.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "OK", style: "destructive" },
          ],
          { cancelable: true }
        );
      }
    } else {
      if (Platform.OS === "web") {
        if (window.confirm("Are you sure you want to delete this item?")) {
          removeProduct(id);
        }
      } else {
        Alert.alert(
          "Confirm Deletion",
          "Are you sure you want to delete this item?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", onPress: () => removeProduct(id), style: "destructive" },
          ],
          { cancelable: true }
        );
      }
    }
  };

  const createOrUpdateProduct = async () => {
    const productData = { name, category, amount, isArchived: false, notes, imageUri, staticImagePath };
    try {
      await addOrUpdateProduct(userId, productDataId = id, productData);
  
      resetForm();
      onClose();
      onChange();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    }
  };

  const removeProduct = async () => {
    try {
      await deleteProduct(userId, id);
      onClose();
      onChange();
    } catch (error) {
      console.error("Error deleting product:", error);
      Alert.alert("Error", "Failed to delete product. Please try again.");
    }
  };

  const openCategoryModal = () => {
    setIsCategoryModalVisible(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalVisible(false);
  };

  const isSaveDisabled = name.trim() === "" || amount === "" || isNaN(parseInt(amount, 10));

  const renderProductImage = () => {
    if (imageUri) {
      return <Image style={styles.ProductCreatePicture_Image} source={{ uri: imageUri }} />;
    } else if (staticImagePath) {
      return <Image style={styles.ProductCreatePicture_Image} source={staticImagePath} />;
    } else {
      return <Image style={styles.ProductCreatePicture_Image} source={require('../../../assets/ProductImages/banana_test.png')} />;
    }
  };

  return (
    <Modal isVisible={isVisible} style={styles.modal} animationIn="slideInUp" animationOut="slideOutDown" backdropColor="black" backdropOpacity={0.5}>
      <BlurView intensity={0} style={styles.blurContainer}>
        <View style={styles.modalContent}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>X</Text>
          </Pressable>

          <View style={styles.CreateProduct_ContentWrapper}>
            <View style={styles.ProductInfo}>
              <View style={{ width: '90%' }}>
                <Text style={styles.IntroText}>
                  {/* {isCreatingNew ? "Create a new product" : "Edit the product"} */}
                </Text>
              </View>

              <View style={styles.ProductCreatePicture}>
                <Pressable onPress={() => setIsImageModalVisible(true)} style={styles.ProductCreatePicture}>
                  {renderProductImage()}
                </Pressable>

                {/* <Modal isVisible={isImageModalVisible} onBackdropPress={() => setIsImageModalVisible(false)}>
                  <View style={styles.imageModalContent}>
                    <Button title="Pick from device" onPress={pickImageFromDevice} />
                    <Text style={styles.StaticImageLabel}>Or select a static image:</Text>
                    <View style={styles.StaticImageRow}>
                      {staticImages.map((img, index) => (
                        <Pressable key={index} onPress={() => handleStaticImageSelect(img)}>
                          <Image
                            source={img}
                            style={[styles.StaticThumbnail, staticImagePath === img && styles.SelectedStaticImage]}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </Modal> */}

                <ModalImagePicker
                  modalVisible={isImageModalVisible}
                  onClose={() => setIsImageModalVisible(false)}
                  onSelect={handleStaticImageSelect}
                  imageOptions={staticImages}
                  pickImageFromDevice={pickImageFromDevice}
                />

              </View>

              <View style={styles.productDataEntry_Wrapper}>
                <View style={[styles.productDataEntry, styles.nameAndAmountWrapper]}>
                  <TextInput
                    style={[styles.productName, styles.productDataEntryInput]}
                    autoCapitalize="sentences"
                    value={name || ''}
                    onChangeText={text => setName(text)}
                    placeholder='Name of a product...'
                    placeholderTextColor={'#9e9e9e'}
                  />
                </View>
                
                <Pressable style={[styles.productDataEntry]} onPress={openCategoryModal}>
                  <Text style={styles.productCategory_Text}>
                    Category:
                    <Text style={{fontFamily: MainFont_Bold, marginLeft: 4, color: blackTextColor}}>
                      {category?.tagName || defaultCategory.name}
                    </Text> 
                  </Text>

                  <ModalProductCategoryPicker
                    isCategoryModalVisible={isCategoryModalVisible}
                    setIsCategoryModalVisible={setIsCategoryModalVisible}
                    onClose={closeCategoryModal}
                    onCategorySelect={handleCategorySelect}
                    categories={categories}
                    alreadySelectedCategory={category}
                  />
                </Pressable>
               
                <View style={[styles.productDataEntry, styles.productAmountWrapper]}>
                  <TextInput
                    style={styles.productAmount}
                    selectTextOnFocus={true}
                    keyboardType="numeric"
                    value={amount || 0}
                    onChangeText={text => setAmount(text)}
                    placeholder='Amount...'
                    placeholderTextColor={'#9e9e9e'}
                  />
                </View>

                <TextInput
                  style={[styles.productDataEntry, styles.productNotes]}
                  onChangeText={text => setNotes(text)}
                  autoCapitalize="sentences"
                  placeholder='Product details...'
                  placeholderTextColor={'#9e9e9e'}
                  value={notes || ''}
                  multiline={true}
                  textAlignVertical="top"
                />

                <View style={styles.buttonPanel}>
                  {!isCreatingNew && (
                    <Pressable style={[styles.Button_DeleteProduct]} onPress={() => confirmDelete(id)}>
                      <Text style={styles.Button_UpdateProduct_Text}><Entypo name="trash" size={28} /></Text>
                    </Pressable>
                  )}

                  <Pressable 
                    style={[styles.Button_UpdateProduct, isSaveDisabled && styles.Button_UpdateProductDisabled, isCreatingNew && styles.Button_UpdateProductAlone]}
                    onPress={createOrUpdateProduct} disabled={isSaveDisabled}>
                    <Text style={styles.Button_UpdateProduct_Text}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </View> 
          </View>
        </View>  
      </BlurView>    
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: backgroundColor,
    // backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 10,
    alignItems: 'center'
  },
  CreateProduct_ContentWrapper: {
    backgroundColor: backgroundColor,
    paddingTop: 14,
    width: '100%',
    borderColor: '#C0C0C0',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    borderRadius: 15,
  },
  ProductInfo: {
    alignItems: 'left',
  },  
  IntroText: {
    fontSize: SecondTitleFontSize + 2,
    fontFamily: ReceiptFont,
    fontWeight: 700,
    marginBottom: 10,
    textAlign: 'left'
  },
  ProductCreatePicture_Image: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: width * 0.7,
    height: width * 0.7,
  }, 
  productDataEntry_Wrapper: {
    width: width * 0.7,
  },
  productDataEntry: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderBottomWidth: 0.1,
    minHeight: 50,       
  },
  nameAndAmountWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  productName: {
    fontSize: SecondTitleFontSize + 2,
    fontFamily: MainFont_Title,
    width: '100%',
    color: blackTextColor,
  },
  productAmountWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: -50,
    left: '25%',
    width: '50%',
    minHeight: 36,
    backgroundColor: buttonColor,
    borderRadius: 30,
    boxShadowColor: buttonColor, 
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.4,
    boxShadowRadius: 4,
    elevation: 4,          
  },
  productCategory_Text: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
    color: greyTextColor,
  },
  productAmount: {
    width: '100%',
    textAlign: 'center',
    fontFamily: MainFont,
    fontSize: SecondTitleFontSize + 1,
  },
  productNotes: {
    height: 80,
    paddingVertical: 10,
    fontFamily: MainFont,
    fontSize: TextFontSize,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    color: greyTextColor,
    lineHeight: 20,
  },
  buttonPanel: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  Button_UpdateProduct: {
    backgroundColor: buttonColor,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    height: width / 9,
    borderRadius: 60,
    fontFamily: MainFont_Title,
    fontSize: SecondTitleFontSize,
    boxShadowColor: buttonColor, 
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.4,
    boxShadowRadius: 4,
    elevation: 4,  
  },
  Button_UpdateProductAlone: {
    width: '100%',
  },
  Button_UpdateProduct_Text: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  Button_UpdateProductDisabled: {
    backgroundColor: '#A9A9A9', 
    boxShadowColor: '#A9A9A9', 
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.4,
    boxShadowRadius: 4,
    elevation: 4, 
  },
  Button_DeleteProduct: {
    borderRadius: 60,
    width: width / 9,
    height: width / 9,
    backgroundColor: deleteButtonColor,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadowColor: deleteButtonColor, 
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.4,
    boxShadowRadius: 4,
    elevation: 4,  
  },
  Button_DeleteProduct_Text: {
    
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: blackTextColor,
    fontWeight: 'bold',
  },


  // StaticImageLabel: { fontSize: 14, marginBottom: 6, color: greyTextColor, textAlign: 'center' },
  // StaticImageRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  // StaticThumbnail: { width: 60, height: 60, borderRadius: 8, marginHorizontal: 5, borderWidth: 1, borderColor: '#ccc' },
  // SelectedStaticImage: { borderColor: buttonColor, borderWidth: 2 },
  // imageModalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
});
