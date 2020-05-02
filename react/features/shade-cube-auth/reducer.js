/* @flow */

import { assign, ReducerRegistry } from '../base/redux';

import {
    SAVE_SHADE_CUBE_AUTH,
    CHANGE_CHECK_FLAG
} from './actionType'
import { PersistenceRegistry } from '../base/storage';

PersistenceRegistry.register('features/shade-cube-auth', true, {
    user: null,
    token: undefined,
    morderator: false,
    checkFlag: false,
});

ReducerRegistry.register('features/shade-cube-auth', (state = {}, action) => {
    switch (action.type) {
        case SAVE_SHADE_CUBE_AUTH:
            return assign(state, {
                ...action.payload
            })

        case CHANGE_CHECK_FLAG:
            return assign(state, {
                checkFlag: !state.checkFlag
            })
        
        default:
            return state;
    }
});