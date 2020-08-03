import { action, extendObservable, computed } from 'mobx';

/** 共用的 store action */
export default class storeAction {
    constructor() {
        this.initState = {};
    }

    /** action - 單項改變  */
    @action updateData = (dataKey, value) => {
        this[dataKey] = value;
    };

    /** action - 多項改變  */
    @action assignData = (obj, validKey) => {
        Object.assign(this, obj);
    };

    /** action - params 單項改變 */
    @action paramsUpdate = (dataKey, value) => {
        const params = { ...this.params, [dataKey]: value };
        this.assignData({ params });
    };

    /** action - params 多項改變 */
    @action paramsAssign = (obj) => {
        const params = { ...this.params, ...obj };
        this.assignData({ params });
    };

    /** reset 狀態 */
    @action reset = () => {
        Object.assign(this, this.initState);
    };
    @action openModal = () => {
        this.updateData('visible', true);
    };
    @action closeModal = () => {
        this.updateData('visible', false);
    };
    @action getList = async () => {
        const res = await this.api.list();
        if (res?.status === 200) {
            this.updateData('list', res?.data?.data?.rows ?? []);
        }
    };
    @action nextPage = () => {
        this.paramsUpdate('offset', this.params.offset + this.params.limit);
    };
}
