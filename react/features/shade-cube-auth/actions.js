// @flow

import type { Dispatch } from 'redux';

import {
    SAVE_SHADE_CUBE_AUTH,
    CHANGE_CHECK_FLAG
} from './actionType'


/**
 * Initiates authenticating via shadecube
 *
 * @param {object} payload - shadecube user.
 * @returns {Function}
 */
export const saveShadeCubeAuth = (payload: Object) => (dispatch: Dispatch<any>) => {
    dispatch({
        type: SAVE_SHADE_CUBE_AUTH,
        payload,
    })
}
export const changeShadeCubeCheckFlag = () => (dispatch: Dispatch<any>) => {
    dispatch({
        type: CHANGE_CHECK_FLAG,
    })
}

