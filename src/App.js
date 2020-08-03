import React from 'react';
import { Provider } from 'mobx-react';
import * as stores from './store';
import CallingScreen from './container/CallingScreen';

const App = () => {
    return (
        <Provider {...stores}>
            <CallingScreen/>
        </Provider>
    );
};

export default App;
