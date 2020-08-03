import { action, extendObservable, computed } from 'mobx';

/** common store action */
export default class storeAction {
    constructor() {
        this.initState = {};
    }

    /** action - update single data  */
    @action updateData = (dataKey, value) => {
        this[dataKey] = value;
    };

    /** action - update multiple data  */
    @action assignData = (obj, validKey) => {
        Object.assign(this, obj);
    };

    /** action - update single param */
    @action paramsUpdate = (dataKey, value) => {
        const params = { ...this.params, [dataKey]: value };
        this.assignData({ params });
    };

    /** action - update multiple param */
    @action paramsAssign = (obj) => {
        const params = { ...this.params, ...obj };
        this.assignData({ params });
    };

    /** reset state */
    @action reset = () => {
        Object.assign(this, this.initState);
    };
}
