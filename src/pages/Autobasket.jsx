import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';

import ButtonGoBack from '../components/ButtonGoBack';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';

const { width } = Dimensions.get('window');

export default function AutobasketPage({ navigation }) {
  // State for search and modal visibility
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  
  // State for products loaded from your DB
  const [products, setProducts] = useState([]);
  const modalSearchRef = useRef(null);

  // This flag disables the ability to create new products if not found in the DB
  const allowNewProduct = false;

  // Example: Fetch products from DB when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      // Replace this with your actual fetch call
      const allProducts = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Orange' },
        { id: 3, name: 'Banana' }
      ];
      setProducts(allProducts);
    };
    fetchProducts();
  }, []);

  // Handle search input changes
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(product =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    } else {
      closeSearchModal();
    }
  };

  // Open modal and focus input
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
        <SearchInput 
          placeholder="Search product" 
          query={searchQuery} 
          onChangeText={openSearchModal} 
        />

        {/* SearchModal receives the extra prop to disable creation of new products */}
        <SearchModal 
          isSearchModalVisible={isSearchModalVisible}
          closeSearchModal={closeSearchModal}
          addProduct={addProduct}
          searchQuery={searchQuery}
          handleSearch={handleSearch}
          filteredData={filteredData}
          isBasket={false}
          allowNewProduct={allowNewProduct}
          ref={modalSearchRef}
        />
      </ScrollView>
    </View>
  );
}
