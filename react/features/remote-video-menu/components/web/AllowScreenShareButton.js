// @flow
import React from 'react'
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';

import { translate } from '../../../base/i18n';
import { IconMessage, IconReply, Icon, IconMicDisabled } from '../../../base/icons';
import { getParticipantById, getParticipants, PARTICIPANT_ROLE } from '../../../base/participants';
import { connect } from '../../../base/redux';

import { setPrivateMessageRecipient, sendMessage, toggleChat
} from '../../../chat/actions';
import { CHAT_CODE } from '../../../base/conference/constants'

export type Props = AbstractButtonProps & {

    /**
     * The ID of the participant that the message is to be sent.
     */
    participantID: string,

    /**
     * True if the button is rendered as a reply button.
     */
    reply: boolean,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function,

    /**
     * The participant object retreived from Redux.
     */
    _participant: Object,

    /**
     * Function to dispatch the result of the participant selection to send a private message.
     */
    _setPrivateMessageRecipient: Function

    // /**
    //  * Function to send a private message.
    //  */
    // _sendMessage: Function
};

/**
 * Class to render a button that initiates the sending of a private message through chet.
 */
class AllowScreenShareButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.allowScreenShare';
    icon = IconMessage;
    label = 'toolbar.privateMessage';
    toggledIcon = IconReply;

    constructor(props: P){
        super(props);
        this.state = {
            screenShareEnabled: this._checkEnabled(props)
        }
    }

    /**
     * Handles clicking / pressing the button, and allow / disallow participant.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.setState(prevState => ({
            screenShareEnabled: !prevState.screenShareEnabled
        }), ()=> {
            this._setScreenShare(this.state.screenShareEnabled)
        })
        
    }

    /**
     * returns screen share is alowded or not
     * @private
     * @returns {Boolean}
     */
    _checkEnabled = (props = this.props, participantID)=> {
        const { 
            _participant,
            _messages,
            // _participants
        } = props;
        const participantId = participantID || _participant.id
        const {
            PATTERN_SCREEN_SHARE,
            ENABLE_SCREEN_SHARE,
            DISABLE_SCREEN_SHARE
        } = CHAT_CODE
        // const morderator = _participants.find(participant => (participant?.role === PARTICIPANT_ROLE.MODERATOR))
        const messages  = _messages.filter(message => message.message.startsWith(PATTERN_SCREEN_SHARE) )
                            .sort((a, b) => b.timestamp - a.timestamp);

        
        if(messages.length ){
            switch (messages[0].message) {
                case `${ENABLE_SCREEN_SHARE}--${participantId}`:
                    return true
            
                case `${DISABLE_SCREEN_SHARE}--${participantId}`:
                    return false
            
                default:
                    return false
            }
        }
        
    }
    /**
     * allow / disallow participant..
     *
     * @param {Boolean} flag - screen share allowed or not.
     * @private
     * @returns {void}
     */
    _setScreenShare = (flag) => {
        const { 
            _participant, 
            _setPrivateMessageRecipient,
            _sendMessage,
            _toggleChat,
            _messages,
            _participants
        } = this.props;

        const {
            PATTERN_START,
            ENABLE_SCREEN_SHARE,
            DISABLE_SCREEN_SHARE
        } = CHAT_CODE
        const morderator = _participants.find(participant => (participant?.role === PARTICIPANT_ROLE.MODERATOR))
        const messages  = _messages.filter(message => message?.id === morderator?.id  && message.message.startsWith(PATTERN_START) )
                            .sort((a, b) => b.timestamp - a.timestamp);
        if(messages.length){
            if(messages[0].message.startsWith(ENABLE_SCREEN_SHARE)){
                const lastParticipantId = messages[0].message.replace(`${ENABLE_SCREEN_SHARE}--`, "")
                const lastParticipant = _participants.find(participant => participant.id === lastParticipantId)

                if(lastParticipant && lastParticipantId !== _participant.id){
                    _setPrivateMessageRecipient();
                    _sendMessage(`${DISABLE_SCREEN_SHARE}--${lastParticipantId}`, true);
                }
            }
        }
        _setPrivateMessageRecipient();
        _sendMessage(`${flag ? ENABLE_SCREEN_SHARE : DISABLE_SCREEN_SHARE}--${_participant.id}`, true);
        // _setPrivateMessageRecipient();
        // _toggleChat()
    }
    /**
     * Helper function to be implemented by subclasses, which must return a
     * {@code boolean} value indicating if this button is toggled or not.
     *
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props.reply;
    }

    render(){
        const label = this.state.screenShareEnabled ? 'toolbar.accessibilityLabel.disallowScreenShare' : 'toolbar.accessibilityLabel.allowScreenShare'
        return (
            <li className = 'popupmenu__item'>
                <a
                    className = { 'popupmenu__link screensharelink' }
                    id = { `screensharelink_${this.props._participant.id}` }
                    onClick = { this._onClick }>
                    <span className = 'popupmenu__icon'>
                        <Icon src = { IconMicDisabled } />
                    </span>
                    <span className = 'popupmenu__text'>
                        { this.props.t(label) }
                    </span>
                </a>
            </li>
        )
    }

}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Props}
 */
export function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
    return {
        _setPrivateMessageRecipient: participant => {
            dispatch(setPrivateMessageRecipient(participant));
        },
        _sendMessage: text => {
            dispatch(sendMessage(text));
        },
        _toggleChat: () => {
            dispatch(toggleChat())
        }
        // _setPrivateMessageRecipient: participant => {
        //     dispatch(setPrivateMessageRecipient(participant));
        // }
        // _sendMessage: text => {
        //     dispatch(sendMessage(text))
        // }
    };
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
    return {
        _messages: state['features/chat'].messages,
        _participant: getParticipantById(state, ownProps.participantID),
        _participants: getParticipants(state)
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(AllowScreenShareButton));
