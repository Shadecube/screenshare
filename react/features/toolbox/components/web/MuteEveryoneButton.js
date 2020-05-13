// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconMicrophone, IconMicDisabled } from '../../../base/icons';
import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';
import { MuteEveryoneDialog } from '../../../remote-video-menu';
import { CHAT_CODE } from '../../../base/conference';
import { setPrivateMessageRecipient, sendMessage } from '../../../chat';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,

    /**
     * The ID of the local participant.
     */
    localParticipantId: string
};

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant (except the local one)
 */
class MuteEveryoneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryone';
    icon = IconMicDisabled;
    toggledIcon = IconMicrophone
    label = 'toolbar.muteEveryone';
    label = 'toolbar.muteEveryone';
    toggledLabel = 'toolbar.unmuteEveryone';

    _updateLables = () => {
        this.accessibilityLabel = this._isMutedAll() ? 'toolbar.accessibilityLabel.unmuteEveryone' : 'toolbar.accessibilityLabel.muteEveryone';
        this.label = this._isMutedAll() ? 'toolbar.unmuteEveryone' : 'toolbar.muteEveryone';
        this.tooltip = this._isMutedAll() ? 'toolbar.unmuteEveryone' : 'toolbar.muteEveryone';
    }
    /**
     * return the mute everyone status from the messages.
     *
     * @private
     * @returns {boolean}
     */
    _isMutedAll = () =>{
        const {
            MUTE_ALL_PARTICIPENTS_EXCEPT,
            UNMUTE_ALL_PARTICIPENTS_EXCEPT
        } = CHAT_CODE
        const {
            _messages,
            localParticipantId
        } = this.props
        const messages = (_messages || []).filter( ({message}) => (message.includes(MUTE_ALL_PARTICIPENTS_EXCEPT) || message.includes(UNMUTE_ALL_PARTICIPENTS_EXCEPT)) && message.includes(localParticipantId) )
        .sort((a, b) => b.timestamp - a.timestamp);
        if(messages[0]?.message && messages[0]?.message === `${MUTE_ALL_PARTICIPENTS_EXCEPT}--${localParticipantId}` ){
            return true
        }
        return false
    }
    _isToggled(){
        return this._isMutedAll()
    }
    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, localParticipantId } = this.props;
        if(this._isMutedAll()){
            dispatch(setPrivateMessageRecipient())
            dispatch(sendMessage(`${CHAT_CODE.UNMUTE_ALL_PARTICIPENTS_EXCEPT}--${localParticipantId}`), true)
        }else{
            sendAnalytics(createToolbarEvent('mute.everyone.pressed'));
            dispatch(openDialog(MuteEveryoneDialog, {
                exclude: [ localParticipantId ],
                callback: ()=> {
                    dispatch(setPrivateMessageRecipient())
                    dispatch(sendMessage(`${CHAT_CODE.MUTE_ALL_PARTICIPENTS_EXCEPT}--${localParticipantId}`), true)
                }
            }));
        }
        setTimeout(() => {
            this._updateLables()
        }, 1000);
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Props} ownProps - The component's own props.
 * @returns {Object}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.shadeCubeRole === PARTICIPANT_ROLE.MODERATOR;
    const { visible } = ownProps;

    return {
        isModerator,
        localParticipantId: localParticipant.id,
        visible: visible && isModerator,
        _messages: state['features/chat'].messages
    };
}

export default translate(connect(_mapStateToProps)(MuteEveryoneButton));
