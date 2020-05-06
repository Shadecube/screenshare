// @flow

import {
    ACTION_SHORTCUT_TRIGGERED,
    AUDIO_MUTE,
    createShortcutEvent,
    sendAnalytics
} from '../../analytics';
import { translate } from '../../base/i18n';
import { MEDIA_TYPE } from '../../base/media';
import { connect } from '../../base/redux';
import { AbstractAudioMuteButton } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';
import { isLocalTrackMuted } from '../../base/tracks';
import { muteLocal } from '../../remote-video-menu/actions';
import { CHAT_CODE } from '../../base/conference';
import { getParticipants, getLocalParticipant, PARTICIPANT_ROLE } from '../../base/participants';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link AudioMuteButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether audio is currently muted or not.
     */
    _audioMuted: boolean,

    /**
     * Whether the button is disabled.
     */
    _disabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @extends AbstractAudioMuteButton
 */
class AudioMuteButton extends AbstractAudioMuteButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.mute';
    label = 'toolbar.mute';
    tooltip = 'toolbar.mute';

    /**
     * Initializes a new {@code AudioMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onKeyboardShortcut = this._onKeyboardShortcut.bind(this);
        this.state = {
            isToggled: false,
            isDisabledByMorderator: false
        }
    }

    /**
     * Registers the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.registerShortcut(
                'M',
                null,
                this._onKeyboardShortcut,
                'keyboardShortcuts.mute');
    }

    /**
     * Unregisters the keyboard shortcut that toggles the audio muting.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        typeof APP === 'undefined'
            || APP.keyboardshortcut.unregisterShortcut('M');
    }

    /**
     * Indicates if audio is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.props._audioMuted;
    }
    _handleClick(){
        super._handleClick()
        // if(this.state.isDisabledByMorderator && this.props._participant.shadeCubeRole !== PARTICIPANT_ROLE.MODERATOR){
        //     if(!this._isAudioMuted()){
        //         super._handleClick()
        //     }
        // }else{
        //     super._handleClick()
        // }
    }
    componentDidUpdate(prevProps){
        if(this.props._messages !== prevProps._messages){
            this._onMessageRecieve()
        }
    }

    /**
     * On signal of morderator, and toggles the audio mute state
     * accordingly.
     *
     * @private
     * @returns {void}
     */
    _onMessageRecieve = () =>{
        const {
            _messages,
            // _participants,
            _participant
        } = this.props
        const {
            PATTERN_AUDIO,
            UNMUTE_PARTICIPENT,
            UNMUTE_ALL_PARTICIPENTS,
            UNMUTE_ALL_PARTICIPENTS_EXCEPT,
            
            MUTE_PARTICIPENT,
            MUTE_ALL_PARTICIPENTS,
            MUTE_ALL_PARTICIPENTS_EXCEPT,
            
        } = CHAT_CODE
        // const morderator = _participants.find(participant => (participant?.role === PARTICIPANT_ROLE.MODERATOR))
        const messages = _messages.filter(message => message.message.startsWith(PATTERN_AUDIO) )
        .sort((a, b) => b.timestamp - a.timestamp);

        if(messages.length){
            const message = messages[0].message
            if(message === `${MUTE_PARTICIPENT}--${_participant.id}`
            || message === `${MUTE_ALL_PARTICIPENTS}`){
                this.setState({
                    isDisabledByMorderator: true,
                }, ()=> {
                    if(!this._isAudioMuted()){
                        this._handleClick();
                    }
                })
            }else if(message.startsWith(MUTE_ALL_PARTICIPENTS_EXCEPT)){
                if(message !== `${MUTE_ALL_PARTICIPENTS_EXCEPT}--${_participant.id}`){
                    this.setState({
                        isDisabledByMorderator: true,
                    }, ()=> {
                        if(!this._isAudioMuted()){
                            this._handleClick();
                        }
                    })
                }
            }
            if(this._isAudioMuted()){
                if(message === `${UNMUTE_PARTICIPENT}--${_participant.id}`
                    || message === `${UNMUTE_ALL_PARTICIPENTS}`
                ){
                    this.setState({
                        isDisabledByMorderator: false
                    }, ()=> {
                        this._handleClick();
                    })
                }else if(message.startsWith(UNMUTE_ALL_PARTICIPENTS_EXCEPT) ){
                    if(message !== `${MUTE_ALL_PARTICIPENTS_EXCEPT}--${_participant.id}`){
                        this.setState({
                            isDisabledByMorderator: false
                        }, ()=> {
                            this._handleClick();
                        })
                    }
                }
            }
                // const lastParticipantId = messages[0].message.replace(`${ENABLE_SCREEN_SHARE}--`, "")
                // const lastParticipant = _participants.find(participant => participant.id === lastParticipantId)

                // if(lastParticipant && lastParticipantId !== _participant.id){
                //     _setPrivateMessageRecipient(lastParticipant);
                //     _sendMessage(`${DISABLE_SCREEN_SHARE}--${lastParticipantId}`, true);
                // }
        }
    }
    _onKeyboardShortcut: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action to
     * toggle the audio muting.
     *
     * @private
     * @returns {void}
     */
    _onKeyboardShortcut() {
        sendAnalytics(
            createShortcutEvent(
                AUDIO_MUTE,
                ACTION_SHORTCUT_TRIGGERED,
                { enable: !this._isAudioMuted() }));

        this._handleClick();
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} audioMuted - Whether audio should be muted or not.
     * @protected
     * @returns {void}
     */
    _setAudioMuted(audioMuted: boolean) {
        this.props.dispatch(muteLocal(audioMuted));
    }

    /**
     * Return a boolean value indicating if this button is disabled or not.
     *
     * @returns {boolean}
     */
    _isDisabled() {
        return this.props._disabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean
 * }}
 */

function _mapStateToProps(state): Object {
    const tracks = state['features/base/tracks'];

    return {
        _audioMuted: isLocalTrackMuted(tracks, MEDIA_TYPE.AUDIO),
        _disabled: state['features/base/config'].startSilent,
        _messages: state['features/chat'].messages,
        _participants: getParticipants(state),
        _participant: getLocalParticipant(state)
    };
}

export default translate(connect(_mapStateToProps)(AudioMuteButton));
