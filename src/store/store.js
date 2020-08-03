/** define all store */
import React from 'react';
import CallingStore from '@container/CallingScreen/store/CallingStore';

import { MobXProviderContext } from 'mobx-react';

function useStores() {
    return React.useContext(MobXProviderContext);
}

export { useStores, CallingStore};
