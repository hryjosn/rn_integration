import { action, extendObservable } from 'mobx';
import storeAction from '@store/storeAction';
import io from "socket.io-client";
import { mediaDevices, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { values } from 'lodash';
const url = 'http://192.168.50.102'; //socketUrl: replace with signal server url

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
const initState = {
    pcPeers: {},
    socket: undefined,
    localStream: undefined,
    remoteList: {},
    stateMicrophone: true
};

class CallingStore extends storeAction {
    constructor() {
        super();
        this.initState = initState;
        extendObservable(this, initState);
    }

    @action getLocalStream = async () => {
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
            this.localStream = await mediaDevices.getUserMedia(constrains)
            this.socket = io.connect(url, { transports: ['websocket'] });
            this.socket.on('leave', () => {
                //leave the room
                this.leave();
            });
            this.socket.on('exchange', data => {
                //exchange each other's socketId
                this.exchange(data);
            });
        } catch (error) {
            console.log('getLocalStream error:', error);
        }
    };
    @action switchCamera = () => {
        //switch front or back camera
        this.localStream.getVideoTracks().forEach(track => {
            track._switchCamera();
        });
    };
    @action exchange = async data => {
        const fromId = data.from; //The socket ID from other user
        let pc;
        if (fromId in this.pcPeers) {
            // If peer connection has been built before,
            // get the pc from pcPeers
            pc = this.pcPeers[fromId];
        } else {
            // If peer connection hasn't been built before,
            // create a new peer connection
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
    @action hangOff = () => {
        this.socket.emit('declineCalling', 'rolotest');
    };
    @action join = roomID => {
        let callback = socketIds => {
            Object.keys(socketIds).forEach(index => {
                this.createPC(socketIds[index], true);
            });
        };
        this.socket.emit('join', roomID, callback);
    };
    @action leave = () => {
        values(this.pcPeers).forEach(pcPeer => {
            pcPeer.close();
        });
        this.remoteList={}

    };
    @action createPC = (socketId, isOffer) => {
        const peer = new RTCPeerConnection(configuration); // new a peer connection
        peer.addStream(this.localStream);   // add the local stream into peer connection

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
            // when the new stream was added event
            this.remoteList[socketId] = event.stream;
        };
        this.pcPeers.socketId = peer; // add new pc into pcPeers object
        return peer;
    };
}

export default new CallingStore();
