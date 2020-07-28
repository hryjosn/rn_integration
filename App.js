import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, Text
} from 'react-native';
import io from 'socket.io-client';

import { Button } from './src/components';
import { values } from 'lodash';

const url = 'http://192.168.50.102';
const socket = io(url);


const App = () => {

    useEffect(() => {

    }, [])
    return (
        <View style={{ flex: 1 }}>
            <Button func={() => {
                console.log(socket)
                socket.emit("Hi", "aaaaaa")
            }} text={'kkkk'}/>
        </View>


    )
}

export default App;
const styles = StyleSheet.create({
    rtcView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 150,
        margin: 10,
    },
});
