import React, { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Text, View, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';


// import BasketItem from '../PageSpecificComponents/BasketComponents/BasketItem';
// import ModalBasketReceipt from '../PageSpecificComponents/BasketComponents/ModalBasketReceipt';
// import SearchInput from '../GeneralComponents/Search';
// import SearchModal from '../GeneralComponents/SearchModal';

// import { ServiceFactory } from '../../services/ServiceFactory';

import { buttonColor, backgroundColor } from '../../assets/Styles/styleVariables';


const { width } = Dimensions.get('window');


export default function BasketPage({}) {

    // const [basket, setBasket] = useState(null);
    // const [error, setError] = useState(null);
    // const basketService = ServiceFactory.createBasketService();

    // const [products, setProducts] = useState([]);
    // const productService = ServiceFactory.createProductService();

    // const [searchQuery, setSearchQuery] = useState('');
    // const [filteredData, setFilteredData] = useState([]);
    // const [isSearchModalVisible, setSearchModalVisible] = useState(false);
    // const modalSearchRef = useRef(null);

    // const [checkedItems, setCheckedItems] = useState({});
    // const [modalReceiptVisible, setModalReceiptVisible] = useState(false);
    // const [receiptProducts, setReceiptProducts] = useState([]);
   

    // const handleSearch = (text) => {
    //     setSearchQuery(text);
    //     let results = [];
    //     if (text) {
    //         console.log(products);
    //         results = products.filter((item) =>
    //         item.name.toLowerCase().includes(text.toLowerCase())
    //         );
    //         results.push(text); // Add the search query as the last element.
    //     } if (text === '') {
    //         closeSearchModal(); // Close the modal when the text input is empty
    //         return;
    //       }
    //     setFilteredData(results);
    //     };

    //     const openSearchModal = (text) => {
    //         setSearchQuery(text);
    //         setSearchModalVisible(true);
    //         handleSearch(text)
    //         // Focus on the modal's search input after the modal is rendered
    //         setTimeout(() => {
    //           modalSearchRef.current?.focus();
    //         }, 100);
    //       };

    //     const closeSearchModal = () => {
    //         setSearchModalVisible(false);
    //         setSearchQuery('');
    //         setFilteredData([]);
    //       };

    //     useFocusEffect( 
    //         React.useCallback(() => {
    //             basketService
    //                 .getBasket("basketId")
    //                 .then(fetchedBasket => {
    //                     setBasket(fetchedBasket);
    //                     productService
    //                         .fetchAllProducts()
    //                         .then(fetchedProducts => {
    //                             if (fetchedBasket && fetchedBasket.products) {
    //                                 const productsNotInBasket = fetchedProducts.filter(product => 
    //                                     !fetchedBasket.products.some(basketProduct => 
    //                                         basketProduct.id === product.id
    //                                     )
    //                                 );
    //                                 console.log(productsNotInBasket);
    //                                 setProducts(productsNotInBasket);
    //                             } else {
    //                                 console.log("here");
    //                                 setProducts(fetchedProducts);
    //                             }
    //                         })
    //                 })
    //                 .catch(error => {
    //                     console.error('Failed to fetch basket or products', error);
    //                 });
                    
    //         }, [])
    //     );

    //     const addProduct = async (item, index) => {
    //         try {
    //             const isLastItem = index === filteredData.length - 1;
    //             let basketProduct = isLastItem ? basketService.mapTemporaryItemToBasketProdct(item) : basketService.mapProductToBasketProduct(item);
    //             const updatedBasket = await basketService.addProductToBasket(basket.id, basketProduct); // Add product
    //             closeSearchModal();
    //             const updatedProducts = products.filter(product => item.id !== product.id); // Remove from filtered data
    //             setProducts(updatedProducts);
    //             setBasket(updatedBasket); // Update state
    //         } catch (error) {
    //             console.error("Failed to add product:", error);
    //             setError("Failed to add product. Please try again.");
    //         }
    //     };

    //     const incrementProductAmount = async (productId, currentAmount) => {
    //         const newAmount = currentAmount + 1; // Increment quantity by 1
        
    //         try {
    //             // Update the quantity for the specified product
    //             const updatedBasket = await basketService.updateProductAmountInBasket(basket.id, productId, newAmount);
        
    //             // Update the state with the updated basket
    //             setBasket(updatedBasket); // Assuming `setBasket` updates the state with the new basket data
        
    //         } catch (error) {
    //             console.error("Failed to increment product quantity:", error);
    //         }
    //     };

    //     const removeProduct = async (productId) => {
    //         try {
    //             const updatedBasket = await basketService.removeProductFromBasket(basket.id, productId); // Remove product
    //             // Find the removed product from the basket
    //             const removedProduct = basket.products.find(product => product.id === productId);

    //             // Add the removed product back to the products array
    //             if (removedProduct) {
    //                 setProducts(prevProducts => [...prevProducts, removedProduct]);
    //             }
    //             setBasket(updatedBasket); // Update state
    //         } catch (error) {
    //             console.error("Failed to remove product:", error);
    //             setError("Failed to remove product. Please try again.");
    //         }
    //     };

    //     const handleToggleCheckbox = (id, isChecked) => {
    //         setCheckedItems((prev) => ({
    //             ...prev,
    //             [id]: isChecked, // Update the checked state of the specific item
    //         }));
    //     };
    
    //     const handleDisplayCheckedItems = () => {
    //         const checkedProducts = basket.products
    //             .filter((product) => checkedItems[product.id])
    //         setReceiptProducts(checkedProducts);
    //         setModalReceiptVisible(true);
    //     };
        
    //     const moveSelectedProducts = async () => {
    //         try {
    //             const selectedProducts = receiptProducts.map(product => product.id)
    //             // Move the selected products from the basket
    //             const updatedBasket = await basketService.moveProductsFromBasket(basket.id, selectedProducts);
        
    //             // Update the state with the updated basket
    //             setBasket(updatedBasket);
        
    //             console.log("Products moved successfully!");
    //         } catch (error) {
    //             console.error("Failed to move selected products:", error);
    //         }
    //     }; 

    return (
        <View style={styles.BasketPage}>
            <ScrollView>

                <View style={styles.BasketPage_ContentWrapper}>

                    {/*<BasketSection category={'Meat'}></BasketSection>*/}
                    {/* REVIEW: The elements not from the Fridge by default get assigned to Other category (if we'll even have categories) */}
                    
                    {/* <SearchInput placeholder={'Find a product'} query={searchQuery} 
                    onChangeText={openSearchModal}></SearchInput>

                    <SearchModal isSearchModalVisible={isSearchModalVisible} closeSearchModal={closeSearchModal} addProduct={addProduct}
                            searchQuery={searchQuery} handleSearch={handleSearch} filteredData={filteredData} isBasket={true} />

                    <View style={styles.BasketPage_ListOfBasketItems}>

                    {
                        basket && basket.products && basket.products.length > 0 ? (
                            basket.products.map((product, index) => {
                                // console.log(basket.products);
                            return <BasketItem key={index} product={product} isChecked={!!checkedItems[product.id]} 
                                    onRemove={removeProduct} onAdd={incrementProductAmount} onToggleCheckbox={handleToggleCheckbox} />;
                            })
                        ) : (
                            <View></View>
                        )
                    }
                    </View> */}
                </View>

            </ScrollView>

                    {/* REVIEW: BUTTON MUST BE GREYED OUT IF THERE ARE NO ITEMS SELECTED */}
            {/* <TouchableOpacity style={[styles.Button_ShowReceipt]} onPress={handleDisplayCheckedItems}>
                        <Text style={styles.Button_ShowReceipt_Text}>Move items to Fridge</Text>
            </TouchableOpacity>

            <ModalBasketReceipt
                visible={modalReceiptVisible} receiptItems={receiptProducts}
                onClose={() => setModalReceiptVisible(false)} onMove={() => moveSelectedProducts()} /> */}

        </View>
    )
}


const styles = StyleSheet.create({

    BasketPage: {
        flex: 1,
        backgroundColor: backgroundColor,
        width: width,
        alignItems: 'center',
      },
  
      BasketPage_ContentWrapper: {
        // paddingTop: 20,
        width: width * 0.96,
        // height: height, 
        // NEED TO CHECK WHAT"S UP WITH HEIGHT WHEN THERE ARE A LOT OF PRODUCTS
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
      },

      BasketPage_ListOfBasketItems: {
        // backgroundColor: 'green',
      },


      modal: {
        margin: 0, // No margin for full-screen modal
        justifyContent: 'start',
        backgroundColor: 'white',
        paddingTop: 20,
      },
      modalContent: {
        padding: 16,
      },

      flatList: {
        marginTop: 8,
      },


      Button_ShowReceipt: {
        marginVertical: 5,
        marginHorizontal: 2,
        paddingLeft: 14,
        justifyContent: 'center',
        // borderRadius: 30,
        borderColor: '#C0C0C0',
        // borderWidth: 1,
        height: 50,

        backgroundColor: buttonColor,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: '60%',
        position: 'absolute',
        top: '90%',
        borderRadius: 30,

        shadowColor: buttonColor, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4, 
    },
    Button_ShowReceipt_Text: {
        fontWeight: 'bold',
    },


});