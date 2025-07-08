import React from 'react';
import { View, StyleSheet, Text, Pressable, Dimensions, 
    // Image 
} from 'react-native';
import { Image } from 'expo-image';
import AppImage from '../image/AppImage';

import { MainFont, MainFont_Bold, MainFont_Title, TextFontSize, SecondTitleFontSize, SecondTitleFontWeight, deleteButtonColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import Tag from './Tag';
import ButtonBouncing from '../Button_Bouncing';

const { width } = Dimensions.get('window');

export default function MealCard({ navigation, recipe, isAvailable, isMealPlanner, handlePress }) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    // const handlePress = !isMealPlanner
    // ? () => navigation.navigate('RecipeCreatePage', { recipe })
    // : undefined;

    // const handlePress = !isMealPlanner
    // ? onPress
    // : undefined;
      
    return (
        <ButtonBouncing onPress={handlePress} style={{borderRadius: 8}}
            label={
                <View style={styles.MealBody} >
                    <View>
                        {recipe.imageUri ? (
                            <Image
                                style={styles.MealImage} source={ {uri: recipe.imageUri }} />
                            ) : (
                            <Image style={styles.MealImage} source={require('../../../assets/ProductImages/banana_test.png')}
                            />
                        )}
                    </View>

                    <View style={styles.MealDescription}>
                        <Text style={styles.MealTitle_Text}>{recipe.title}</Text>
                        <Text style={styles.MealDescription_Text}>Calories, cooking time</Text>
                        
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
                </View>
            } toScale={0.98}
        />
        // <Pressable style={styles.MealBody} onPress={handlePress} >            
        //     <View>
        //         {recipe.imageUri ? (
        //             <Image
        //                 style={styles.MealImage}
        //                 source={ {uri: recipe.imageUri }}
        //             />
        //             ) : (
        //             <Image
        //                 style={styles.MealImage}
        //                 source={require('../../../assets/ProductImages/banana_test.png')}
        //             />
        //         )}
        //     </View>

        //     <View style={styles.MealDescription}>
        //         <Text style={styles.MealTitle_Text}>{recipe.title}</Text>
        //         <Text style={styles.MealDescription_Text}>Calories, cooking time</Text>
                
        //         <View style={styles.tagsContainer}>
        //             {
        //                 recipe.categories && recipe.categories.length > 0 ? (
        //                     recipe.categories.map((category, index) => {
        //                         return <Tag key={index} name={category.tagIcon}/>
        //                     })
        //                 ) : ( <Tag name={"No tag"}></Tag> )
        //             }
        //         </View>                

        //     </View>

        //     <View style={isAvailable ? styles.ProductAvailabilityLabel : 
        //         [styles.ProductAvailabilityLabel, styles.ProductNonAvailabilityLabel]}/>
        // </Pressable>
)}



const styles = StyleSheet.create({
    moreText: {
        fontSize: 16,
        marginRight: 5,
      },

    MealBody: {
        // marginTop: 14,
        // width: '90%',
        backgroundColor: 'white',
        // add8e6 
        // opacity: 0.9,
        flexDirection: 'row',
        // borderColor: 'green',
        // borderWidth: 2,
        width: '100%',
        height: width / 4,

        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 2,
  
        // shadowColor: '#007bff', 
        // shadowOffset: { width: 0, height: 4 },
        // shadowOpacity: 0.4,
        // shadowRadius: 10,
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