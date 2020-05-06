/* @flow */

import { assign, ReducerRegistry } from '../base/redux';

import {
    SET_SHADE_CUBE_ROOM
} from './actionType'

const initialState = {
    room: undefined,
}

ReducerRegistry.register('features/shade-cube-room', (state = initialState, action) => {
    switch (action.type) {
        case SET_SHADE_CUBE_ROOM: 
            return assign(state, {
                room: action.room
            })
        
        default:
            return state;
    }
});