import React, {useState} from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import UserOptionsModal from './UserOptionsModal';
import NotificationsModal from './NotificationsModal';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TopNavigationButtons = () => {
    const [showUserOptions, setShowUserOptions] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => setShowNotifications(true)}
                style={{ marginRight: 20 }}
            >
                <MaterialIcons name="notifications" size={28} color="black" />
            </Pressable>


            <Pressable
                onPress={() => setShowUserOptions(true)}
            >
                <MaterialIcons name="account-circle" size={28} color="black" />
            </Pressable>

        <UserOptionsModal
            isVisible={showUserOptions}
            onClose={() => setShowUserOptions(false)}
            onViewProfile={() => {
            setShowUserOptions(false);
            // navigate to profile
            }}
            onLogout={() => {
            setShowUserOptions(false);
            // handle logout
            }}
        />
        <NotificationsModal isVisible={showNotifications} onClose={() => setShowNotifications(false)}
        />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // marginRight: -6,
        // backgroundColor: '#f8f8f8',
    },
});

export default TopNavigationButtons;