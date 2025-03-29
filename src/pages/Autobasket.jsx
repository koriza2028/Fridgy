import React, { useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import useAuthStore from '../store/authStore';
import { fetchAllProducts } from '../store/fridgeStore';

import ButtonGoBack from '../components/ButtonGoBack';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';

const { width } = Dimensions.get('window');

export default function AutobasketPage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);

  // State for search and modal visibility
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  
  // State for products loaded from your DB
  const [products, setProducts] = useState([]);
  const modalSearchRef = React.useRef(null);

  // This flag disables the ability to create new products if not found in the DB
  const allowNewProduct = false;

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [userId])
  );

  const loadProducts = async () => {
    if (userId) {
      const fridgeProducts = await fetchAllProducts(userId);
      setProducts(fridgeProducts);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    console.log('Search text:', text);
    if (text) {
      const results = products.filter(product => 
            product.name.toLowerCase().includes(text.toLowerCase())
        );
        console.log(results);
        setFilteredData(results);
    } else {
      closeSearchModal();
    }
  };

  const openSearchModal = (text) => {
    setSearchQuery(text);
    setSearchModalVisible(true);
    handleSearch(text);
    setTimeout(() => {
      modalSearchRef.current?.focus();
    }, 100);
  };

  // Close the search modal and reset states
  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setFilteredData([]);
  };

  // Add product only from the DB
  const addProduct = (item) => {
    // Add your logic to add the selected product from DB to the basket
    console.log('Adding product:', item);
    closeSearchModal();
  };

  return (
    <View style={{ flex: 1 }}>
      <ButtonGoBack navigation={navigation} />
      <ScrollView>
        {/* Search Input that opens the modal on text change */}
        <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} />
          
          <SearchModal 
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProduct}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            isBasket={true}
          />
      </ScrollView>
    </View>
  );
}
