import React, {useEffect, useState, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, View, Text, TextInput, Image, TouchableOpacity, FlatList, Alert,
    KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform,  Dimensions, ScrollView } from "react-native";

// import Modal from 'react-native-modal';
// // import Entypo from 'react-native-vector-icons/Entypo';

// import ButtonGoBack from '../GeneralComponents/Button_GoBack';
// import IngredientItem from "../PageSpecificComponents/CookingComponents/IngredientCard";
// import Tag from "../PageSpecificComponents/CookingComponents/Tag";
// import ModalProductCategoryPicker from "../PageSpecificComponents/FridgeComponents/ModalProductCategoryPicker";

// import { ServiceFactory } from "../../services/ServiceFactory";

import { buttonColor, deleteButtonColor, addButtonColor, backgroundColor, 
         MainFont, MainFont_Bold, MainFont_Title, ReceiptFont, TextFontSize, SecondTitleFontSize, SecondTitleFontWeight } from '../../assets/Styles/styleVariables';
import { tags } from "../../assets/Variables/categories";      

// import { useFonts } from 'expo-font';
// import Entypo from 'react-native-vector-icons/Entypo';
// import SearchModal from "../GeneralComponents/SearchModal";

// NEED TO CARRY THAT TO THE SEPARATE FILE

const { width, height } = Dimensions.get('window');


export default function RecipeCreatePage({navigation, route}) {

    // const confirmDelete = (id) => {
    //     // MOVE IT TO A SEPARATE FILE
    //     if (Platform.OS === 'web') {
    //         // For web, use the browser's built-in confirm dialog
    //         if (window.confirm('Are you sure you want to delete this item?')) {
    //             removeRecipe(id);
    //         }
    //         } else {
    //         // For native apps, use React Native's Alert
    //         Alert.alert(
    //             'Confirm Deletion',
    //             'Are you sure you want to delete this item?',
    //             [
    //             {
    //                 text: 'Cancel',
    //                 onPress: () => console.log('Deletion cancelled'),
    //                 style: 'cancel',
    //             },
    //             {
    //                 text: 'Delete',
    //                 onPress: () => removeRecipe(id),
    //                 style: 'destructive',
    //             },
    //             ],
    //             { cancelable: true }
    //         );
    //         }
    //     };


    // const [fontsLoaded] = useFonts({
    //     'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    //     'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    //     'Inter-Title': require('../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
    // });

    // const recipe = route.params?.recipe || null;

    // const [title, setTitle] = useState(recipe?.title || '');
    // const [description, setDescription] = useState(recipe?.description || '');
    // const [id, setId] = useState(recipe?._id || '');
    // const [categories, setCategories] = useState(recipe?.categories || []);
    // // const [categoryIcons, setCategoryIcons] = useState(recipe?.categoryIcons || []); LETS INTEGRATE ADDITIONAL PROPERTY INSTEAD OF REWORKING THE WHOLE THING
    // const [mandatoryIngredients, setMandatoryIngredients] = useState(recipe?.mandatoryIngredients || []);
    // const [optionalIngredients, setOptionalIngredients] = useState(recipe?.optionalIngredients || []);

    // const [isCreatingNew, setisCreatingNew] = useState(true);
    

    // useEffect(() => {
    //     if (recipe !== null && recipe._id !== undefined) {
    //         setTitle(recipe.title);
    //         setDescription(recipe.description);
    //         setId(recipe._id);
    //         setCategories(recipe.categories);
    //         setMandatoryIngredients(recipe.mandatoryIngredients);
    //         setOptionalIngredients(recipe.optionalIngredients);
    //         setisCreatingNew(false);
    //     } else {
    //         setTitle(''); 
    //         setDescription('');
    //         setId('');
    //         setCategories([]);
    //         setMandatoryIngredients([]);
    //         setOptionalIngredients([]);
    //         setisCreatingNew(true);
    //     }
    // }, [recipe]);

    // const [products, setProducts] = useState([]);
    // const productService = ServiceFactory.createProductService();
    // const recipeBookService = ServiceFactory.createRecipeBookService();

    // const [error, setError] = useState(null);

    // const [searchQuery, setSearchQuery] = useState('');
    // const [filteredData, setFilteredData] = useState(products);

    // const [isSearchModalVisible, setSearchModalVisible] = useState(false);
    // const modalSearchRef = useRef(null);

    // const [isMandatory, setIsMandatory] = useState(null);

    // const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    // const openCategoryModal = () => {
    //     setIsCategoryModalVisible(true);
    // };
    // const closeCategoryModal = () => {
    //     setIsCategoryModalVisible(false);
    // };

    // const handleMultipleCategoriesSelect = (selectedCategories) => {
    //     console.log('Selected Categories:', selectedCategories);
    //     setCategories(selectedCategories);
    //   };

    // useFocusEffect( 
    //     React.useCallback(() => {
    //         productService
    //             .fetchAllProducts()
    //             .then(fetchedProducts => {
    //                 setProducts(
    //                     fetchedProducts.filter(product => 
    //                             !mandatoryIngredients.some(ingredient => 
    //                                 ingredient._id === product.id
    //                             )
    //                     ).sort((a, b) => a.name.localeCompare(b.name))
    //                 );

    //                 setFilteredData(
    //                     fetchedProducts.filter(product => 
    //                         !mandatoryIngredients.some(ingredient => 
    //                             ingredient._id === product.id
    //                         )
    //                     ).sort((a, b) => a.name.localeCompare(b.name))
    //                 ); // Initialize filteredData with full list

    //             })
    //             .catch(error => {
    //                 console.error('Failed to fetch available products:', error);
    //             });
    //     }, [])
    // );


    // const SaveOrUpdateRecipe = () => {
    //     // console.log(mandatoryIngredients);
    //     recipeBookService.createOrUpdateRecipe({_id: id, title, categories, mandatoryIngredients, optionalIngredients, description});

    //     setTitle('');
    //     setDescription('Other');
    //     setId('');
    //     navigation.navigate('CookingPage');
    // }

    // const handleSearch = (text) => {
    //     setSearchQuery(text);
    //     let results = [];
    //     if (text) {
    //         results = products.filter((item) =>
    //             item.name.toLowerCase().includes(text.toLowerCase())
    //         );
    //     } if (text === '') {
    //         results = products;
    //     }
    //     results.sort((a, b) => a.name.localeCompare(b.name));
    //     setFilteredData(results);
    // };

    // const addIngredient = async (item, isMandatory) => {        
    //     try {
    //         const ingredietToAdd = await recipeBookService.mapProductToIngredient(item);

    //         // setMandatoryIngredients(prevIngredients => [...prevIngredients, ingredietToAdd]);
    //         if (isMandatory) {
    //             setMandatoryIngredients(prevIngredients => [...prevIngredients, ingredietToAdd]);
    //         } else {
    //             setOptionalIngredients(prevIngredients => [...prevIngredients, ingredietToAdd]);
    //         }

    //         // console.log(isMandatory)

    //         closeSearchModal();
    //         const updatedProducts = products.filter(product => item.id !== product.id); // Remove from filtered datazz
    //         setProducts(updatedProducts);
    //     } catch (error) {
    //         console.error("Failed to add product:", error);
    //         setError("Failed to add product. Please try again.");
    //     }
    // };

    // const removeProduct = (productId) => {
    //     try {
    //         // Remove the ingredient with the matching _id from `mandatoryIngredients`
    //         setMandatoryIngredients(prevIngredients => {
    //             const updatedIngredients = prevIngredients.filter(ingredient => ingredient._id !== productId);

    //             productService
    //             .fetchAllProducts()
    //             .then(fetchedProducts => {
    //                 setProducts(fetchedProducts.filter(product => !updatedIngredients.some(ingredient => ingredient._id === product.id)));
    //             })
    //             .catch(error => {
    //                 console.error('Failed to fetch available products:', error);
    //             });
    //             return updatedIngredients;
    //         });
    //     } catch (error) {
    //         console.error("Failed to remove product:", error);
    //         setError("Failed to remove product. Please try again.");
    //     }
    // };

    // const removeRecipe = async (id) => {
    //     try {
    //         await recipeBookService.deleteRecipe(id);
    //         navigation.navigate('CookingPage'); 
    //     } catch (error) {
    //         console.error("Failed to remove recipe:", error);
    //         setError("Failed to remove recipe. Please try again.");
    //     }
    // };
    
    // const openSearchModal = (isMandatory) => {
    //     // setSearchQuery(text);
    //     setFilteredData(products);
    //     setIsMandatory(isMandatory);
    //     setSearchModalVisible(true);
    //     // handleSearch(text);
    //     // Focus on the modal's search input after the modal is rendered
    //     setTimeout(() => {
    //         modalSearchRef.current?.focus();
    //     }, 100);
    // };

    // const closeSearchModal = () => {
    //     setSearchModalVisible(false);
    //     setSearchQuery('');
    //     setFilteredData([]);
    //   };   
      

    // const isSaveDisabled = title.trim() === '' || mandatoryIngredients.length === 0;

    return (
        // <View style={styles.RecipeCreatePage}>
        //     {isCreatingNew && <View><Text style={styles.Text_ProductDataLabel}>Create a new recipe</Text></View>}
        //     {!isCreatingNew &&<View><Text style={styles.Text_ProductDataLabel}>Edit recipe</Text></View>}
        //     {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={2} >        */}
        //     <ScrollView style={{ height: '100vh' }}>

        //         <View style={styles.RecipeCreatePage_ContentWrapper}> 
        //             <Image style={styles.ProductCreatePicture} source={require('../../assets/ProductImages/banana_test.png')}></Image>

        //             <View style={styles.productDataEntry_Wrapper}>

        //                 <View style={styles.productDataEntry}>
        //                     {/* <Text style={styles.productDataEntry_Text}>Name</Text> */}
        //                     <TextInput style={[styles.productDataEntryInput, styles.productName]} autoCapitalize="sentences" value={title} onChangeText={text => setTitle(text)}
        //                     placeholder='How is it called?' placeholderTextColor={'#9e9e9e'}/>
        //                 </View>    
        //                 {/* Is there a limit on length of a name? */}

        //                 <View style={styles.productDataEntry}>
        //                     <TouchableOpacity style={[styles.productDataEntryInput, styles.productTags]} onPress={openCategoryModal}>
        //                         {
        //                             categories && categories.length > 0 ? (
        //                                 categories.map((category, index) => {
        //                                     return <Tag key={index} name={category.tagName} type={category.tagType} icon={category.tagIcon}/>
        //                                 })
        //                             // ) : ( <Text style={styles.productCategory_Text}>Enter some tags: </Text> )
        //                             ) : ( <Tag name={'Add tags +'}> </Tag> )
        //                         }
        //                     </TouchableOpacity>
        //                 </View>

        //                 <ModalProductCategoryPicker isCategoryModalVisible={isCategoryModalVisible} 
        //                                             setIsCategoryModalVisible={setIsCategoryModalVisible} 
        //                                             onClose={closeCategoryModal}
        //                                             onCategorySelect={handleMultipleCategoriesSelect} multiSelect={true}
        //                                             categories={tags} alreadySelectedCategories={categories || []}>
        //                 </ModalProductCategoryPicker>

        //                 <View style={styles.productDataEntry}>
        //                     {/* <Text style={styles.productDataEntry_Text}>Description</Text> */}
        //                     <TextInput style={[styles.productDataEntryInput, styles.productNotes]} autoCapitalize="sentences" value={description} onChangeText={text => setDescription(text)} 
        //                         placeholder='Do you need instructions how to cook it?' placeholderTextColor={'#9e9e9e'}
        //                         multiline={true} textAlignVertical="top"/>
        //                 </View>
                        
        //             </View>   

        //             <View style={styles.ListOfIngredients}>

        //                 <View style={styles.SubListOfIngredients}>
        //                     {/* <Text style={styles.ListOfIngredients_Text}>Mandatory Ingredients</Text> */}
        //                     <View style={styles.IngredientsHeader}>
        //                         <Text style={styles.ListOfIngredients_Text}>Mandatory Ingredients</Text>
        //                         <TouchableOpacity onPress={() => openSearchModal(true)} style={styles.addIngredient_Button}>
        //                             <Text style={styles.addIngredient_ButtonText}>Add</Text>
        //                         </TouchableOpacity>
        //                     </View>
        //                 </View>
        //                     {
        //                         mandatoryIngredients && mandatoryIngredients.length > 0 ? (
        //                             mandatoryIngredients.map((ingredient, index) => {
        //                                 return <IngredientItem key={index} ingredient={ingredient} isMandatory={true} onRemove={removeProduct}/>;
        //                             })
        //                         ) : (
        //                             <View>
        //                                 <Text style={{fontFamily: MainFont, fontSize: 14, marginBottom: 6}}>Select at least one ingredient</Text>
        //                             </View>
        //                         )
        //                     }

        //                 <View style={styles.SubListOfIngredients}>
        //                     <View style={styles.IngredientsHeader}>
        //                         <Text style={styles.ListOfIngredients_Text}>Optional Ingredients</Text>
        //                         <TouchableOpacity onPress={() => openSearchModal(false)} style={styles.addIngredient_Button}>
        //                             <Text style={styles.addIngredient_ButtonText}>Add</Text>
        //                         </TouchableOpacity>
        //                     </View>
        //                 </View>
        //                     {
        //                         optionalIngredients && optionalIngredients.length > 0 ? (
        //                             optionalIngredients.map((ingredient, index) => {
        //                                 return <IngredientItem key={index} ingredient={ingredient} isMandatory={false} onRemove={removeProduct}/>;
        //                             })
        //                         ) : ( <View></View> )
        //                     }
        //                 </View>

        //             <SearchModal isSearchModalVisible={isSearchModalVisible} closeSearchModal={closeSearchModal} 
        //                 searchQuery={searchQuery} handleSearch={handleSearch} filteredData={filteredData}
        //                 isRecipeCreate={true} addProduct={addIngredient} isMandatory={isMandatory}/>

        //         </View>
             
        //     </ScrollView>
        //     {/* </KeyboardAvoidingView> */}
        //     <View style={styles.buttonPanel}>
        //         {!isCreatingNew && (
        //             <TouchableOpacity style={[styles.Button_DeleteRecipe]} onPress={() => confirmDelete(id)}>
        //                 <Text style={styles.Button_SaveRecipe_Text}><Entypo name="trash" size={28} /></Text>
        //             </TouchableOpacity>
        //         )}

        //         <TouchableOpacity 
        //             style={[styles.Button_SaveRecipe, isSaveDisabled && styles.Button_SaveRecipeDisabled, isCreatingNew && styles.Button_SaveRecipeAlone]}
        //             onPress={SaveOrUpdateRecipe} disabled={isSaveDisabled}>
        //             <Text style={styles.Button_UpdateProduct_Text}>Save</Text>
        //         </TouchableOpacity>
        //     </View>

        //     <ButtonGoBack navigation={navigation}></ButtonGoBack>
        
        // </View>
        <View/>
    )
}



const styles = StyleSheet.create({
    RecipeCreatePage: {
        // backgroundColor: backgroundColor,
        flex: 1,
        backgroundColor: '#FFF',

        // REVIEW: ADD THE ELEMENT UNDER THE PAGE TO HIDE THE UGLY ANGLES 
    },
    RecipeCreatePage_ContentWrapper: {     
        alignItems: 'center',
        marginBottom: 90,
    },

    Text_ProductDataLabel: {
        marginBottom: 20,
        marginTop: 62,
        fontSize: SecondTitleFontSize,
        fontFamily: ReceiptFont,
        fontWeight: 700,
        textAlign: 'center',
    },
    ProductCreatePicture: {
        width: width,
        height: width,
        // transform: [
        //     { translateX: -10 }, 
        //     { translateY: -60 }, 
        //     { scale: 1.2 },    
        //   ],
    }, 
    // SelectAnotherPicture: {
    //     position: 'relative',
    //     top: -30,
    // },
    productDataEntry_Wrapper: {
        width: '100%',
        backgroundColor: '#fff',
        marginTop: -90,
        paddingTop: 10,
    },
    productDataEntry: {        
        paddingHorizontal: 10,
        // paddingBottom: 6,
        justifyContent: 'center',
        borderColor: '#D3D3D3',
        borderBottomWidth: 0.1,
    },
    productDataEntryInput: {
        marginVertical: 6,
    },
    productName: {
        fontSize: SecondTitleFontSize + 4,
        fontFamily: MainFont_Title,
        height: 40,
    },
    productTags: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 0,
        height: 50,
    },
    productCategory_Text: {
        fontFamily: MainFont,
        fontSize: TextFontSize
    },
    productNotes: {
        fontFamily: MainFont,
        fontSize: TextFontSize,
        height: 80,
        paddingVertical: 10,
        lineHeight: '140%',
    },
    ListOfIngredients: {
        marginTop: 10,
        width: '100%',
        paddingHorizontal: 10,
    },
    IngredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addIngredient_Button: {
        marginRight: 14,
        borderWidth: 1,
        borderRadius: 20,
        borderBlockColor: addButtonColor,
        paddingVertical: 4,
        paddingHorizontal: 6,

        shadowColor: addButtonColor, 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 1, 
    },
    addIngredient_ButtonText: {
        fontFamily: MainFont,
        fontSize: TextFontSize,
        color: addButtonColor,

    },
    ListOfIngredients_Text: {
        // marginBottom: 10,
        fontWeight: SecondTitleFontWeight,
        fontSize: SecondTitleFontSize + 2,
    },
    SubListOfIngredients: {
        marginVertical: 6,
    },
    ButtonsContainer: {
        width: '100%',
    },

    buttonPanel: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 10,
        position: 'absolute',
        bottom: 2,
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
    },

    Button_SaveRecipe: {
        backgroundColor: buttonColor,
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: width / 9,
        borderRadius: 60,
        // position: 'absolute',
        // bottom: 20,
        // borderRadius: 30,
        // marginTop: 10,

        shadowColor: buttonColor, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,         
    },

    Button_UpdateProduct_Text: {
        fontFamily: MainFont_Title,
        fontSize: SecondTitleFontSize,
    },

    Button_SaveRecipeAlone: {
        width: '100%',
    },

    Button_DeleteRecipe: {
        // borderBottomLeftRadius: 10,
        // borderBottomRightRadius: 10,
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

    Button_SaveRecipeDisabled: {
        backgroundColor: '#A9A9A9',

        shadowColor: '#A9A9A9', 
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4, 
    },

    Button_EditRecipe: {
        width: '100%',
    },

    // CategoryPicker: {
    //     height: '100%',
    //     width: '100%',
    //     justifyContent: 'center',
    // },

    
})