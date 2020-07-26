import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, Text
} from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import { Button } from './components';
import { values } from 'lodash';

const url = 'localhost:8080';

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        },
        {
            urls: 'stun:stun.xten.com',
        },
    ],
};


const App = () => {
    const socket = io.connect(url, { transports: ['websocket'] });
    const pcPeers = {};
    const [localStream, setLocalStream] = useState(undefined)
    // localStream: '',
    //     remoteList: [],
    //     remoteCamera: 1, //on:1 ,off :0
    //     localCamera: 1, //on:1 ,off :0
    //     stateMicrophone: true,
    // const { streamURL } = this.state;
    // const remoteList = values(this.state.remoteList);
    useEffect(() => {
        // (async () => {
        //     await getLocalStream();
        // })()
        socket.on('leave', () => {
            this.leave();
        });
        socket.on('exchange', data => {
            this.exchange(data);
        });
        socket.on('turnOffCamera', param => {
            this.setState({ remoteCamera: param });
        });
    }, [])
    const getLocalStream = async () => {
        try {
            // console.log("mediaDevices",mediaDevices.)
            // const sourceInfos = await mediaDevices.enumerateDevices();
            // const videoSourceId = sourceInfos.find(item => item.kind === 'videoinput' && item.facing === 'front').deviceId;

            const stream = await mediaDevices
                .getUserMedia({
                    //this function request both camera and audio permissions
                    audio: true,
                    video: {
                        mandatory: {
                            minWidth: 640,
                            minHeight: 360,
                            minFrameRate: 30,
                        },
                        facingMode: 'user',
                        // optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
                    },
                })
            console.log("stream",stream)
            join('abc');
            setLocalStream(stream)
        } catch (error) {
            console.log('getLocalStream error:', error);
        }
    };
    const switchCamera = () => {
        localStream.getVideoTracks().forEach(track => {
            track._switchCamera();
        });
    };
    const exchange = data => {
        const fromId = data.from;
        let pc;
        if (fromId in this.pcPeers) {
            pc = this.pcPeers[fromId];
        } else {
            pc = this.createPC(fromId, false);
        }

        if (data.sdp) {
            let sdp = new RTCSessionDescription(data.sdp);
            pc.setRemoteDescription(sdp).then(() =>
                pc.remoteDescription.type === 'offer'
                    ? pc
                        .createAnswer()
                        .then(desc =>
                            pc
                                .setLocalDescription(desc)
                                .then(() =>
                                    this.socket.emit('exchange', {
                                        to: fromId,
                                        sdp: pc.localDescription,
                                    }),
                                ),
                        )
                    : null,
            );
        } else {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };
    const onPress = () => {
        this.join('abc');
    };
    //hang off the phone
    const hangOff = () => {
        this.socket.emit('declineCalling', 'abc');
    };
    const join = roomID => {
        let callback = socketIds => {
            Object.keys(socketIds).forEach(index => {
                this.createPC(socketIds[index], true);
            });
        };
        this.socket.emit('join', roomID, callback);
    };
    const leave = () => {
        values(this.pcPeers).forEach(pcPeer => {
            pcPeer.close();
        });
        this.setState({
            remoteList: {},
        });
    };
    const createPC = (socketId, isOffer) => {
        const peer = new RTCPeerConnection(configuration);
        this.pcPeers = {
            ...this.pcPeers,
            [socketId]: peer,
        };
        peer.addStream(this.state.localStream);

        peer.onicecandidate = event => {
            if (event.candidate) {
                this.socket.emit('exchange', {
                    to: socketId,
                    candidate: event.candidate,
                });
            }
        };

        peer.onnegotiationneeded = () => {
            if (isOffer) {
                createOffer();
            }
        };

        peer.onsignalingstatechange = async event => {
            // when the signal state become stable record the data and stop ringback

            if (event.target.signalingState === 'stable') {
                if (Platform.OS === 'ios') {
                    this.localStream.getVideoTracks().forEach(track => {
                        //For ios to trigger the camera on
                        track._switchCamera();
                        track._switchCamera();
                    });
                }
            }
        };

        peer.onaddstream = event => {
            const remoteList = this.state.remoteList;
            remoteList[socketId] = event.stream;

            this.setState({ remoteList });
        };

        const createOffer = () => {
            peer.createOffer().then(desc => {
                peer.setLocalDescription(desc).then(() => {
                    this.socket.emit('exchange', {
                        to: socketId,
                        sdp: peer.localDescription,
                    });
                });
            });
        };

        return peer;
    };

    return (
        <View style={{ flex: 1 }}>
            <Button func={() => {
                getLocalStream()
            }} text={'Enter room'}/>
            {/*<Button func={hangOff} text={'hang off'}/>*/}
            {/*<Button func={switchCamera} text={'Change Camera'}/>*/}
            {/*<RTCView streamURL={localStream.toURL()} style={styles.rtcView}/>*/}

            {/*{remoteList.length > 0 && (*/}
            {/*    <RTCView*/}
            {/*        style={styles.rtcView}*/}
            {/*        objectFit={'cover'}*/}
            {/*        key={`Remote_RTCView`}*/}
            {/*        streamURL={remoteList[remoteList.length - 1].toURL()}*/}
            {/*    />*/}
            {/*)}*/}
            <Text> 123 </Text>
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
