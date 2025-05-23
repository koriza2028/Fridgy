import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Keyboard,
  Dimensions,
  Animated,
  Easing,
} from "react-native";

import ImageWithUpload from "../../components/ImageWithUpload";
import { useFocusEffect } from '@react-navigation/native';
import Modal from "react-native-modal";
import { BlurView } from "expo-blur";
import Entypo from "react-native-vector-icons/Entypo";

import ModalProductCategoryPicker from "./ModalProductCategoryPicker";
import useAuthStore from '../../store/authStore';
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

const { width, height } = Dimensions.get("window");
const isSmallScreen = height < 700;
const defaultCategory = { tagName: "Other", tagIcon: "❓", tagType: 1 };

export default function ModalCreateProduct({
  isVisible,
  onClose,
  product,
  onChange,
  usedIngredients,
}) {
  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });


  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [amount, setAmount] = useState(1);
  const [notes, setNotes] = useState("");
  const [id, setId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [staticImagePath, setStaticImagePath] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  // const [shouldRenderContent, setShouldRenderContent] = useState(true);

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
  }
}, [product]);

  // useEffect(() => {
  //   return () => {
  //     resetForm();
  //   };
  // }, []);

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

  const handleClose = () => {
    onClose();
  };

  const handleCategorySelect = (selectedTag) => {
    setCategory(selectedTag);
  };

  const confirmDelete = (id) => {
    if (usedIngredients.includes(id)) {
      Alert.alert(
        "This product is used in a recipe or in the basket and cannot be deleted."
      );
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
  };

  const createOrUpdateProduct = async () => {
    const productData = {
      name,
      category,
      amount,
      isArchived: false,
      notes,
      imageUri,
      staticImagePath,
    };
    onClose()
    try {
      await addOrUpdateProduct(ctx, id, productData);
      ;
      // resetForm();
      onChange();
    } catch (error) {
      console.error("Error saving product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    }
  };

  const removeProduct = async () => {
    try {
      await deleteProduct(ctx, id);
      onClose();
      onChange();
    } catch (error) {
      console.error("Error deleting product:", error);
      Alert.alert("Error", "Failed to delete product. Please try again.");
    }
  };

  const isSaveDisabled = name.trim() === "" || amount === "" || isNaN(parseInt(amount, 10));

  const keyboardHeight = useRef(new Animated.Value(0)).current;
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener("keyboardWillShow", (e) => {
      if (isNotesFocused) {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    });

    const keyboardWillHide = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [isNotesFocused]);

  const renderProductImage = () => {
    return (
      <ImageWithUpload
        imageUri={imageUri}
        staticImagePath={staticImagePath}
        setImageUri={setImageUri}
        setStaticImagePath={setStaticImagePath}
        imageStyle={styles.ProductCreatePicture_Image}
        containerStyle={styles.ProductCreatePicture_Image}
      />
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="fadeOut"
      animationInTiming={500}
      animationOutTiming={350}
      useNativeDriver={true}
      backdropColor="black"
      backdropOpacity={0.5}
      onModalHide={() => resetForm()}
      hideModalContentWhileAnimating={true}
    >
      <BlurView intensity={0} style={styles.blurContainer}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: Animated.multiply(keyboardHeight, -0.5) }] },
            ]}
          >
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </Pressable>

            <View style={styles.CreateProduct_ContentWrapper}>
              <View style={styles.ProductInfo}>
                <View style={{ width: '90%' }}>
                  <Text style={styles.IntroText}></Text>
                </View>

                <View style={styles.ProductCreatePicture}>
                  {renderProductImage()}
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

                  <Pressable style={[styles.productDataEntry, styles.productCategory]} onPress={() => setIsCategoryModalVisible(true)}>
                    <Text style={styles.productCategory_Text}>Category:</Text>
                    <Text style={{fontFamily: MainFont_Bold, marginLeft: 4, color: blackTextColor}}>
                      {category?.tagName || defaultCategory.name}
                    </Text>

                    <ModalProductCategoryPicker
                      isCategoryModalVisible={isCategoryModalVisible}
                      setIsCategoryModalVisible={setIsCategoryModalVisible}
                      onClose={() => setIsCategoryModalVisible(false)}
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
                      value={amount !== undefined && amount !== null ? String(amount) : ""}
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
                    onFocus={() => setIsNotesFocused(true)}
                    onBlur={() => setIsNotesFocused(false)}
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
          </Animated.View>
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
    borderRadius: 30,
    alignItems: 'center'
  },
  CreateProduct_ContentWrapper: {
    backgroundColor: backgroundColor,
    // paddingTop: 14,
    width: '100%',
    borderColor: '#C0C0C0',
    borderWidth: 1,
    paddingHorizontal: 24,
    // paddingTop: 10,
    paddingBottom: 16,
    borderRadius: 30,
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
    shadowColor: buttonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
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
  productCategory: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    shadowColor: buttonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
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
    shadowColor: '#A9A9A9', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4, 
  },
  Button_DeleteProduct: {
    borderRadius: 60,
    width: width / 9,
    height: width / 9,
    backgroundColor: deleteButtonColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: deleteButtonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,  
  },
  Button_DeleteProduct_Text: {
    
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: blackTextColor,
    fontWeight: 'bold',
  },


  // StaticImageLabel: { fontSize: 14, marginBottom: 6, color: greyTextColor, textAlign: 'center' },
  // StaticImageRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  // StaticThumbnail: { width: 60, height: 60, borderRadius: 8, marginHorizontal: 5, borderWidth: 1, borderColor: '#ccc' },
  // SelectedStaticImage: { borderColor: buttonColor, borderWidth: 2 },
  // imageModalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
});
