import React, { useEffect } from 'react';
import {
    View, Text
} from 'react-native';
import {
    RTCView
} from 'react-native-webrtc';
import { observer } from 'mobx-react';
import { Button } from '@components';
import { values } from 'lodash';
import { useStores } from "../../store";

const CallingScreen = () => {
    const { localStream, remoteList, getLocalStream, hangOff, switchCamera, join } = useStores()['CallingStore']
    const remoteStream = values(remoteList)[values(remoteList).length - 1];
    useEffect(() => {
        const init = async () => {
            await getLocalStream();
        }
        init();

    }, [])
    return (
        <View style={{ flex: 1 }}>
            <RTCView objectFit={'cover'}
                     streamURL={localStream?.toURL()} style={{ flex: 1 }}/>
            {
                remoteStream ?
                    <RTCView
                        style={{ flex: 1 }}
                        objectFit={'cover'}
                        streamURL={remoteStream?.toURL()}
                    /> :
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text> User haven't enter the room. </Text>
                    </View>
            }

            <View style={{ flexDirection: "row" }}>
                <Button func={() => {
                    join('rolotest')
                }} text={'Enter room'}/>
                <Button func={hangOff} text={'hang off'}/>
                <Button func={switchCamera} text={'Change Camera'}/>
            </View>
        </View>
    );
}

export default observer(CallingScreen);
