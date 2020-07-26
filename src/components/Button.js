import { StyleSheet, TouchableOpacity, Text } from "react-native";
import React from "react";

const Button = ({func, text}) => {
    return (
        <TouchableOpacity style={styles.button} onPress={func}>
            <Text style={styles.text}>{text}</Text>
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    text: {
        fontSize: 16
    },
    button: {
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'black',
        width: '50%',
        margin: 10,
        padding: 10,
        borderRadius: 10,
    },
});

export default Button;
