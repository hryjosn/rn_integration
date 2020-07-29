import React, { useEffect, useState, Component } from 'react';
import {
    View, StyleSheet, Text,
} from 'react-native';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    mediaDevices,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import { container, rtcView } from './styles';

import { Button } from './components';
import { values } from 'lodash';

const url = 'http://localhost'; //please replace with your ip


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

class App extends Component {
    constructor(props) {
        super(props);
        this.pcPeers = {};
        this.socket = io.connect(url, { transports: ['websocket'] });
        this.state = {
            localStream: undefined,
            remoteList: [],
            remoteCamera: 1, //on:1 ,off :0
            localCamera: 1, //on:1 ,off :0
            stateMicrophone: true,
        };
    }

    async componentDidMount() {
        await this.getLocalStream();
        this.socket.on('leave', () => {
            this.leave();
        });
        this.socket.on('exchange', data => {
            this.exchange(data);
        });
        this.socket.on('turnOffCamera', param => {
            this.setState({ remoteCamera: param });
        });
    }

    getLocalStream = async () => {
        try {
            const sourceInfos = await mediaDevices.enumerateDevices();
            const videoSourceId = sourceInfos.find(item => item.kind === 'videoinput' && item.facing === 'front').deviceId;
            const constrains = {
                //this function request both camera and audio permissions
                audio: true,
                video: {
                    mandatory: {
                        minWidth: 640,
                        minHeight: 360,
                        minFrameRate: 30,
                    },
                    facingMode: 'user',
                    optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
                },
            }
            const localStream = await mediaDevices.getUserMedia(constrains)
            this.setState({ localStream })
        } catch (error) {
            console.log('getLocalStream error:', error);
        }
    };
    switchCamera = () => {
        this.localStream.getVideoTracks().forEach(track => {
            track._switchCamera();
        });
    };
    exchange = async data => {
        const fromId = data.from;
        let pc;
        if (fromId in this.pcPeers) {
            pc = this.pcPeers[fromId];
        } else {
            pc = await this.createPC(fromId, false, this.localStream);
        }

        if (data.sdp) {
            let sdp = new RTCSessionDescription(data.sdp);
            await pc.setRemoteDescription(sdp)
            if (pc.remoteDescription.type === 'offer') {
                const desc = await pc.createAnswer()
                await pc.setLocalDescription(desc)
                this.socket.emit('exchange', {
                    to: fromId,
                    sdp: pc.localDescription,
                })
            }

        } else {
            if (data.candidate) {
                pc.addIceCandidate(new RTCIceCandidate(data.candidate));

            }
        }
    };
    //hang off the phone
    hangOff = () => {
        this.socket.emit('declineCalling', 'abc');
    };
    join = roomID => {
        let callback = socketIds => {
            Object.keys(socketIds).forEach(index => {
                this.createPC(socketIds[index], true);
            });
        };
        this.socket.emit('join', roomID, callback);
    };
    leave = () => {
        values(this.pcPeers).forEach(pcPeer => {
            pcPeer.close();
        });
        this.setState({
            remoteList: {},
        });
    };
    createPC = (socketId, isOffer) => {
        const peer = new RTCPeerConnection(configuration);
        this.pcPeers = {
            ...this.pcPeers,
            [socketId]: peer,
        };
        peer.addStream(this.state.localStream);

        peer.onicecandidate = event => {
            console.log("onicecandidate event", event)
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

        // peer.onsignalingstatechange = async event => {
        //     // when the signal state become stable record the data and stop ringback
        //
        //     if (event.target.signalingState === 'stable') {
        //         if (Platform.OS === 'ios') {
        //             this.localStream.getVideoTracks().forEach(track => {
        //                 //For ios to trigger the camera on
        //                 track._switchCamera();
        //                 track._switchCamera();
        //             });
        //         }
        //     }
        // };

        peer.onaddstream = event => {
            const remoteList = this.state.remoteList;
            remoteList[socketId] = event.stream;
            this.setState({ remoteList });
        };

        const createOffer = async () => {
            const desc = await peer.createOffer()
            await peer.setLocalDescription(desc)
            this.socket.emit('exchange', {
                to: socketId,
                sdp: peer.localDescription,
            });
        };

        return peer;
    };

    render() {
        const { localStream } = this.state;
        const remoteList = values(this.state.remoteList);

        return (
            <View style={{
                flex: 1,

            }}>


                {localStream && <RTCView streamURL={localStream.toURL()} style={styles.rtcView}/>}

                {remoteList.length > 0 && (
                    <RTCView
                        style={styles.rtcView}
                        objectFit={'cover'}
                        key={`Remote_RTCView`}
                        streamURL={remoteList[remoteList.length - 1].toURL()}
                    />
                )}
                <View style={{alignItems: "center"}}>
                    <Button func={() => {
                        this.join('rolotest')
                        console.log("enter room")
                    }} text={'Enter room'}/>
                    <Button func={this.hangOff} text={'hang off'}/>
                    <Button func={this.switchCamera} text={'Change Camera'}/>
                </View>

            </View>
        );
    }
}

export default App;
const styles = StyleSheet.create({
    rtcView: {
        flex: 1
    },
});
