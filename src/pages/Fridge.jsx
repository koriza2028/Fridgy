import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
// import { useFocusEffect } from "@react-navigation/native";

// import { ServiceFactory } from "../../services/ServiceFactory";

// import CollapsibleSection from "../GeneralComponents/CollapsableSection";
// import ModalCreateProduct from "../PageSpecificComponents/FridgeComponents/ModalCreateProduct";

// import ProductCard from "../PageSpecificComponents/FridgeComponents/ProductCard";
// import SearchInput from '../GeneralComponents/Search';
// import AddNewButton from "../GeneralComponents/Button_AddNew";

import { backgroundColor, MainFont, TextFontSize } from '../../assets/Styles/styleVariables';
// import { useFonts } from 'expo-font';
// import { categoryNames } from "../../assets/Variables/categories";


const { width } = Dimensions.get('window');


export default function FridgePage({ navigation }) {
//   const [availableProducts, setAvailableProducts] = useState([]);
//   const [archivedProducts, setArchivedProducts] = useState([]);
//   const [filteredAvailable, setFilteredAvailable] = useState([]);
//   const [filteredArchived, setFilteredArchived] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const productService = ServiceFactory.createProductService();

//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState('All');

//   const [fontsLoaded] = useFonts({
//     'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
//   });

//   const openModal = (product = null) => {
//       setSelectedProduct(product);
//       setIsModalVisible(true);
//   };

//   const closeModal = () => {
//       setIsModalVisible(false);
//       setSelectedProduct(null);
//   };

//   const refreshProducts = async () => {
//       try {
//           const fetchedAvailable = await productService.fetchAvailableProducts();
//           const fetchedArchived = await productService.fetchArchivedProducts();

//           setAvailableProducts(fetchedAvailable);
//           setArchivedProducts(fetchedArchived);
//           setFilteredAvailable(fetchedAvailable);
//           setFilteredArchived(fetchedArchived);
//       } catch (error) {
//           console.error("Failed to fetch products:", error);
//       }
//   };

//   useFocusEffect(
//     React.useCallback(async () => {
//         refreshProducts();
//     }, [])
//   );

//   useEffect(() => {
//         if (!searchQuery.trim()) {
//             setFilteredAvailable(availableProducts.filter(product => selectedCategory === 'All' || product.category === selectedCategory));
//             setFilteredArchived(archivedProducts.filter(product => selectedCategory === 'All' || product.category === selectedCategory));
//             return;
//         }
//         const lowerCaseQuery = searchQuery.toLowerCase();
//         setFilteredAvailable(
//             availableProducts.filter(product => {
//                 product.name.toLowerCase().includes(lowerCaseQuery)&&
//             (selectedCategory === 'All' || product.category === selectedCategory)
//   })
//         );
//         setFilteredArchived(
//             archivedProducts.filter(product => product.name.toLowerCase().includes(lowerCaseQuery)&&
//             (selectedCategory === 'All' || product.category === selectedCategory))
//         );
//     }, [searchQuery, availableProducts, archivedProducts, selectedCategory]);

//   const filterByCategory = (category) => {
//         setSelectedCategory(category);
//     };

//   const removeProduct = async (id) => {
//       try {
//           await productService.removeProduct(id);
//           await refreshProducts(); 
//           closeModal();
//       } catch (error) {
//           console.error("Error while removing product:", error);
//       }
//   };

//   const moveProductToBasket = async (id) => {
//         try {
//             await productService.moveProductToBasket(id);
//             await refreshProducts();
//         } catch (error) {
//             console.error("Error while moving product to basket:", error);
//         }
//     };

//   const createOrUpdateProduct = async (product) => {
//       try {
//           await productService.createOrUpdateProduct(product);
//           await refreshProducts(); 

//       } catch (error) {
//           console.error("Error while creating/updating product:", error);
//       }
//   };

//   const addProduct = async (id) => {
//       try {
//           await productService.addProduct(id);
//           await refreshProducts();
//       } catch (error) {
//           console.error("Error while adding product:", error);
//       }
//   };

//   const decrementProduct = async (id) => {
//         try {
//             await productService.decrementProduct(id);
//             await refreshProducts();
//         } catch (error) {
//             console.error("Error while decrementing product:", error);
//         }
//     };

  return (
      <View style={styles.FridgePage}>
          <ScrollView>
              <View style={styles.FridgePage_ContentWrapper}>
                  {/* <TextInput style={styles.searchInput} placeholder="Find a product" value={searchQuery} onChangeText={setSearchQuery}/> */}
                  {/* <SearchInput placeholder={'Find a product'} query={searchQuery} onChangeText={setSearchQuery}></SearchInput>

                  <View style={styles.ProductFilter}>
                      {['All', ...categoryNames].map((category, index) => (
                          <TouchableOpacity key={index} style={styles.ProductFilterCategory} onPress={() => filterByCategory(category)}>
                              <Text style={styles.ProductFilterCategory_Text}>{category}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>   

                  <CollapsibleSection title="Available Products">
                        {filteredAvailable.length > 0 ? (
                            filteredAvailable.map(product => (
                                <ProductCard
                                    key={product.id} id={product.id} 
                                    onAdd={addProduct} onRemove={removeProduct} onDecrement={decrementProduct} onMoveToBasket={moveProductToBasket}
                                    openModal={() => openModal(product)}
                                    name={product.name} category={product.category} amount={product.amount} navigation={navigation} image={product.image}/>
                            ))
                        ) : (
                            <Text style={{paddingLeft: 4, fontFamily: MainFont}}>No available products found.</Text>
                        )}
                    </CollapsibleSection>
                
                    <CollapsibleSection title="Archived Products">
                        {filteredArchived.length > 0 ? (
                            filteredArchived.map(product => (
                                <ProductCard
                                    key={product.id} id={product.id}
                                    onAdd={addProduct} onRemove={removeProduct} onDecrement={decrementProduct} onMoveToBasket={moveProductToBasket}
                                    openModal={() => openModal(product)}
                                    name={product.name} category={product.category} amount={product.amount} navigation={navigation} />
                            ))
                        ) : (
                            <Text style={{paddingLeft: 4, fontFamily: MainFont}}>No archived products found.</Text>
                        )}
                    </CollapsibleSection>

                    <ModalCreateProduct
                        isVisible={isModalVisible}
                        onClose={closeModal}
                        product={selectedProduct ? { 
                            ...selectedProduct, 
                            category: selectedProduct.category || { name: "Other", icon: "❓", type: "general" } 
                        } : null} // Ensure category is always an object
                        onCreateOrUpdate={createOrUpdateProduct}
                        onRemove={removeProduct}
                    /> */}
              </View>
          </ScrollView>
{/* 
          <TouchableOpacity style={styles.Button_AddProduct} onPress={openModal}>
              <Text style={styles.Button_AddProduct_Text}>+</Text>
          </TouchableOpacity> */}

          <AddNewButton creativeAction={openModal} />
      </View>
  );
}

// Task(product) will have: Id & Content 


// Styles

const styles = StyleSheet.create({
    FridgePage: {
      flex: 1,
      backgroundColor: backgroundColor,
      alignItems: 'center',
      width: width,
    },

    FridgePage_ContentWrapper: {
      width: width * 0.96,
    //   borderColor: 'black',
    //   borderWidth: 1,
    },

    ProductFilter: {
      flexDirection: 'row',
      marginBottom: 10,
    //   marginLeft: 6,
      overflow: 'hidden',
      flexWrap: 'wrap',
    },

    ProductFilterCategory: {
      marginRight: 10,
      marginBottom: 6,
      paddingHorizontal: 8,
        paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
    borderColor: '#ccc',

      shadowColor: "darkgrey", 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 1, 
    },

    ProductFilterCategory_Text: {
        fontFamily: MainFont,
        fontSize: TextFontSize - 2,
    },
  
  });
