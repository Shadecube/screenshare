// @flow

import type { Dispatch } from 'redux';

import {
    SET_SHADE_CUBE_ROOM
} from './actionType'


/**
 * Initiates room via shadecube
 *
 * @param {object} room - shadecube room detail.
 * @returns {Function}
 */
export const setShadeCubeRoom = (room: Object) => (dispatch: Dispatch<any>) => {
    dispatch({
        type: SET_SHADE_CUBE_ROOM,
        room
    })
}

