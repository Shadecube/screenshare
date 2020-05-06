// @flow

import {
    createRemoteVideoMenuButtonEvent,
    sendAnalytics
} from '../../analytics';
import { openDialog } from '../../base/dialog';
import { IconMicDisabled } from '../../base/icons';
import { MEDIA_TYPE } from '../../base/media';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../base/toolbox';
import { setPrivateMessageRecipient, sendMessage, toggleChat
} from '../../chat/actions';
import { isRemoteTrackMuted } from '../../base/tracks';

import { MuteRemoteParticipantDialog } from '.';
import { CHAT_CODE } from '../../base/conference';
import { getParticipantById } from '../../base/participants';

export type Props = AbstractButtonProps & {

    /**
     * Boolean to indicate if the audio track of the participant is muted or
     * not.
     */
    _audioTrackMuted: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant object that this button is supposed to
     * mute/unmute.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * An abstract remote video menu button which mutes the remote participant.
 */
export default class AbstractMuteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.remoteMute';
    icon = IconMicDisabled;
    label = 'videothumbnail.domute';
    toggledLabel = 'videothumbnail.muted';

    /**
     * Handles clicking / pressing the button, and mutes the participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, participantID, _participant } = this.props;
        const {
            UNMUTE_PARTICIPENT,
            MUTE_PARTICIPENT
        } = CHAT_CODE
        if(this._isDisabled()){
            
            dispatch(setPrivateMessageRecipient(_participant))
            dispatch(sendMessage(`${UNMUTE_PARTICIPENT}--${participantID}`), true)
            dispatch(setPrivateMessageRecipient())
            dispatch(toggleChat())

        }else{
            sendAnalytics(createRemoteVideoMenuButtonEvent(
                'mute.button',
                {
                    'participant_id': participantID
                }));
    
            dispatch(openDialog(MuteRemoteParticipantDialog, { 
                participantID,
                afterSubmit : ()=>{
                    dispatch(setPrivateMessageRecipient(_participant))
                    dispatch(sendMessage(`${MUTE_PARTICIPENT}--${participantID}`), true)
                    dispatch(setPrivateMessageRecipient())
                    dispatch(toggleChat())
                }
            }));
        }

        // sendAnalytics(createRemoteVideoMenuButtonEvent(
        //     'mute.button',
        //     {
        //         'participant_id': participantID
        //     }));

        // dispatch(openDialog(MuteRemoteParticipantDialog, { participantID }));
    }

    /**
     * Renders the item disabled if the participant is muted.
     *
     * @inheritdoc
     */
    _isDisabled() {
        return this.props._audioTrackMuted;
    }

    /**
     * Renders the item toggled if the participant is muted.
     *
     * @inheritdoc
     */
    _isToggled() {
        return this.props._audioTrackMuted;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @param {Object} ownProps - Properties of component.
 * @private
 * @returns {{
 *      _audioTrackMuted: boolean
 *  }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const tracks = state['features/base/tracks'];

    return {
        _participant: getParticipantById(state, ownProps.participantID),
        _audioTrackMuted: isRemoteTrackMuted(
            tracks, MEDIA_TYPE.AUDIO, ownProps.participantID)
    };
}
