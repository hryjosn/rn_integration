import React, { Component } from 'react';
import {
    View, StyleSheet,
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

const url = 'http://localhost'; //socketUrl: replace with signal server url


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
            stateMicrophone: true,
        };
    }

    async componentDidMount() {
        await this.getLocalStream();
        //The socket event
        this.socket.on('leave', () => {
            //leave the room
            this.leave();
        });
        this.socket.on('exchange', data => {
            //exchange each other's socketId
            this.exchange(data);
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
                        // Provide your own width, height and frame rate here
                        minWidth: 640,
                        minHeight: 360,
                        minFrameRate: 30,
                    },
                    facingMode: 'user',
                    optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],//sourceId for iOS
                },
            }
            const localStream = await mediaDevices.getUserMedia(constrains)
            this.setState({ localStream }) //set the localStream for local view
        } catch (error) {
            console.log('getLocalStream error:', error);
        }
    };
    switchCamera = () => {
        //switch front or back camera
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
        this.socket.emit('declineCalling', 'rolotest');
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
            if (event.candidate) {
                this.socket.emit('exchange', {
                    to: socketId,
                    candidate: event.candidate,
                });
            }
        };

        peer.onnegotiationneeded = async () => {
            if (isOffer) {
                const desc = await peer.createOffer()
                await peer.setLocalDescription(desc)
                this.socket.emit('exchange', {
                    to: socketId,
                    sdp: peer.localDescription,
                });
            }
        };
        peer.onaddstream = event => {
            const remoteList = this.state.remoteList;
            remoteList[socketId] = event.stream;
            this.setState({ remoteList });
        };
        return peer;
    };

    render() {
        const { localStream } = this.state;
        const remoteList = values(this.state.remoteList);

        return (
            <View style={{ flex: 1 }}>
                {localStream && <RTCView streamURL={localStream.toURL()} style={styles.rtcView}/>}

                {remoteList.length > 0 && (
                    <RTCView
                        style={styles.rtcView}
                        objectFit={'cover'}
                        key={`Remote_RTCView`}
                        streamURL={remoteList[remoteList.length - 1].toURL()}
                    />
                )}
                <View style={{ alignItems: "center" }}>
                    <Button func={() => {
                        this.join('rolotest')
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
