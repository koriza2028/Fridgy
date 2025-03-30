import React from 'react';
import { View, StyleSheet, Text, Pressable, Dimensions, Image } from 'react-native';

import { MainFont, MainFont_Bold, MainFont_Title, TextFontSize, SecondTitleFontSize, SecondTitleFontWeight, deleteButtonColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import Tag from './Tag';

const { width } = Dimensions.get('window');

export default function MealCard({ navigation, recipe, isAvailable }) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });
      
    return (
        <Pressable style={styles.MealBody} onPress={() => { navigation.navigate('RecipeCreatePage', {recipe}) }}>
            
            <View>
                {recipe.imageUri ? (
                    <Image
                        style={styles.MealImage}
                        source={recipe.imageUri}
                    />
                    ) : (
                    <Image
                        style={styles.MealImage}
                        source={require('../../../assets/ProductImages/banana_test.png')}
                    />
                )}
            </View>

            <View style={styles.MealDescription}>
                <Text style={styles.MealTitle_Text}>{recipe.title}</Text>
                <Text style={styles.MealDescription_Text}>Meal description</Text>
                
                <View style={styles.tagsContainer}>
                    {
                        recipe.categories && recipe.categories.length > 0 ? (
                            recipe.categories.map((category, index) => {
                                return <Tag key={index} name={category.tagIcon}/>
                            })
                        ) : ( <Tag name={"No tag"}></Tag> )
                    }
                </View>                

            </View>

            <View style={isAvailable ? styles.ProductAvailabilityLabel : 
                [styles.ProductAvailabilityLabel, styles.ProductNonAvailabilityLabel]}/>

        </Pressable>
)}



const styles = StyleSheet.create({
    moreText: {
        fontSize: 16,
        marginRight: 5,
      },

    MealBody: {
        marginTop: 14,
        // width: '90%',
        backgroundColor: 'white',
        // add8e6 
        // opacity: 0.9,
        flexDirection: 'row',
        // borderColor: 'green',
        // borderWidth: 2,
        width: '98%',
        height: width / 4,

        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadowColor: '#000',
        boxShadowOffset: { width: 0, height: 2 },
        boxShadowOpacity: 0.2,
        boxShadowRadius: 6,
        elevation: 2,
  
        // boxShadowColor: '#007bff', 
        // boxShadowOffset: { width: 0, height: 4 },
        // boxShadowOpacity: 0.4,
        // boxShadowRadius: 10,
        // elevation: 5,
    },

    MealImage: {
        width: width / 4,
        height: width / 4,
        justifySelf: 'center',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        // borderRadius: 60,
        // borderRightWidth: 2,
    },

    MealDescription: {
        paddingLeft: 10,
        justifyContent: 'space-between',
        flex: 1,
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
    },
    MealTitle_Text: {
        fontSize: SecondTitleFontSize + 2,
        fontWeight: SecondTitleFontWeight,
        fontFamily: MainFont_Bold,
        marginTop: 4,
    },
    MealCategory_Text: {
        marginBottom: 4,
        fontFamily: MainFont,
        fontSize: TextFontSize,
    },

    tagsContainer: {
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 6,      
        width: '90%',
        // borderColor: '#C0C0C0',
        // borderWidth: 1,  
    },

    ProductAvailabilityLabel: {
        width: width / 8,
        height: width / 12,
        backgroundColor: '#14db71',
        borderTopRightRadius: 10,
        // borderBottomRightRadius: 10,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 60,
        position: 'absolute',
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },

    ProductNonAvailabilityLabel: {
        backgroundColor: deleteButtonColor,
    },

    ProductAvailabilityLabel_Text: {
        fontFamily: MainFont_Bold,
        fontSize: TextFontSize,
    }

});