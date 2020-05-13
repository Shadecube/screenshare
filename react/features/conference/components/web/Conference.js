// @flow

import _ from 'lodash';
import React from 'react';

import VideoLayout from '../../../../../modules/UI/videolayout/VideoLayout';

import { connect, disconnect } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { connect as reactReduxConnect } from '../../../base/redux';
import { Chat, sendMessage, setPrivateMessageRecipient } from '../../../chat';
import { Filmstrip } from '../../../filmstrip';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';

import {
    Toolbox,
    fullScreenChanged,
    setToolboxAlwaysVisible,
    showToolbox
} from '../../../toolbox';

import { maybeShowSuboptimalExperienceNotification } from '../../functions';

import Labels from './Labels';
import { default as Notice } from './Notice';
import { default as Subject } from './Subject';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';
import { PARTICIPANT_ROLE, participantUpdated, getParticipants, getLocalParticipant } from '../../../base/participants';
import { shadeCubeApis, CHAT_CODE } from '../../../base/conference';
import { maybeRedirectToWelcomePage } from '../../../app';
import { setShadeCubeRoom } from '../../../shade-cube-room';
import { saveShadeCubeAuth } from '../../../shade-cube-auth';

declare var APP: Object;
declare var config: Object;
declare var interfaceConfig: Object;

/**
 * DOM events for when full screen mode has changed. Different browsers need
 * different vendor prefixes.
 *
 * @private
 * @type {Array<string>}
 */
const FULL_SCREEN_EVENTS = [
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'fullscreenchange'
];

/**
 * The CSS class to apply to the root element of the conference so CSS can
 * modify the app layout.
 *
 * @private
 * @type {Object}
 */
const LAYOUT_CLASSNAMES = {
    [LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW]: 'horizontal-filmstrip',
    [LAYOUTS.TILE_VIEW]: 'tile-view',
    [LAYOUTS.VERTICAL_FILMSTRIP_VIEW]: 'vertical-filmstrip'
};

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Whether the local participant is recording the conference.
     */
    _iAmRecorder: boolean,

    /**
     * The CSS class to apply to the root of {@link Conference} to modify the
     * application layout.
     */
    _layoutClassName: string,

    dispatch: Function,
    t: Function
}

/**
 * The conference page of the Web application.
 */
class Conference extends AbstractConference<Props, *> {
    _onFullScreenChange: Function;
    _onShowToolbar: Function;
    _originalOnShowToolbar: Function;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Throttle and bind this component's mousemove handler to prevent it
        // from firing too often.
        this._originalOnShowToolbar = this._onShowToolbar;
        this._onShowToolbar = _.throttle(
            () => this._originalOnShowToolbar(),
            100,
            {
                leading: true,
                trailing: false
            });

        // Bind event handler so it is only bound once for every instance.
        this._onFullScreenChange = this._onFullScreenChange.bind(this);
    }

    /**
     * Start the connection and get the UI ready for the conference.
     *
     * @inheritdoc
     */
    componentDidMount() {
        document.title = interfaceConfig.APP_NAME;
        this._updateShadeCubeMorderator()
        this._checkShadeCubeRoomStatus(()=>{
            this._start()
        });
    }

    _checkShadeCubeRoomStatus = (cb) => {
        const room = window.location.pathname.replace("/", "");
        fetch(`${shadeCubeApis.CONFERENCE_API}/${room}/`).then(res => res.json())
        .then(res => {
            if(res.is_active){
                this.props.dispatch(setShadeCubeRoom(res));
                if(typeof cb === "function"){
                    cb();
                }
            }else{
                this.props.dispatch(maybeRedirectToWelcomePage())
                // window.location.href = "/"
            }
        })
        .catch(()=> {
            this.props.dispatch(maybeRedirectToWelcomePage())
            // window.location.href= "/"
        })
    }
    
    /**
     * Calls into legacy UI to update the application layout, if necessary.
     *
     * @inheritdoc
     * returns {void}
     */
    componentDidUpdate(prevProps) {

        if(this.props._shadeCubeRoom !== prevProps._shadeCubeRoom && this.props._shadeCubeRoom.room?.auth_id){
            this._updateShadeCubeMorderator(true)
        }
        if(this.props._participant.id !== prevProps._participant.id ||
            this.props._participant.connectionStatus !== prevProps._participant.connectionStatus 
        ){
            setTimeout(() => {
                this._updateShadeCubeMorderator(true)
            }, 2000);
        }
        // this._updateShadeCubeMorderator()
        this._updateRestUserRoles(prevProps)
        this._removeFormRommOnSignal(prevProps)
        if (this.props._shouldDisplayTileView
            === prevProps._shouldDisplayTileView) {
            return;
        }

        // TODO: For now VideoLayout is being called as LargeVideo and Filmstrip
        // sizing logic is still handled outside of React. Once all components
        // are in react they should calculate size on their own as much as
        // possible and pass down sizings.
        VideoLayout.refreshLayout();
        // if(this.props._auth.checkFlag !== prevProps._auth.checkFlag){
        //     this._checkShadeCubeRoomStatus()
        // }
    }

    /**
     * Disconnect from the conference when component will be
     * unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.UI.unbindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.removeEventListener(name, this._onFullScreenChange));

        APP.conference.isJoined() && this.props.dispatch(disconnect());
    }

    /**
     * update shadecube user as morderator if user auth match with room
     * 
     * @private
     * @returns {void}
     */

    _updateShadeCubeMorderator = (force = false) => {
        const {
            _messages,
            _participant,
            _auth,
            _shadeCubeRoom
        } = this.props
        const filterdMessages = _messages.filter( m => m.message.startsWith(CHAT_CODE.PATTERN_SHADE_CUBE_ROLE) && m.message.includes(_participant?.id))
        .sort((a, b) => b.timestamp - a.timestamp);
        if(filterdMessages.length === 0 || force){
            if(_auth.user?.auth_id === _shadeCubeRoom.room?.auth_id){
                this.props.dispatch(saveShadeCubeAuth({
                    morderator: true
                }))
                if(_participant?.id){
                    this.props.dispatch(participantUpdated({
                        id: _participant.id,
                        shadeCubeRole: PARTICIPANT_ROLE.MODERATOR
                    }))
                    setTimeout(() => {
                        this._signalForOtherUser(_participant.id, true)
                    }, 1000);
                }
            }else{
                this.props.dispatch(saveShadeCubeAuth({
                    morderator: false
                }))
                if(_participant?.id){
                    this.props.dispatch(participantUpdated({
                        id: _participant.id,
                        shadeCubeRole: PARTICIPANT_ROLE.NONE
                    }))
                    setTimeout(() => {
                        this._signalForOtherUser(_participant.id, false)
                    }, 1000);
                }
            }
        }
    }

    _signalForOtherUser = (id, isMorderator = false) => {
        const {
            _messages
        } = this.props
        const filterdMessages = _messages.filter( m => m.message.startsWith(CHAT_CODE.PATTERN_SHADE_CUBE_ROLE) && m.message.includes(id))
        .sort((a, b) => b.timestamp - a.timestamp);
        
        const oldMsg = filterdMessages[0]?.message
        const newMsg = `${isMorderator ? CHAT_CODE.CHANGE_SHADE_CUBE_ROLE_MORDERATOR : CHAT_CODE.CHANGE_SHADE_CUBE_ROLE_NONE}--${id}`
        if(oldMsg !== newMsg){   

            
            this.props.dispatch(setPrivateMessageRecipient())
            this.props.dispatch(sendMessage(newMsg, true))
        }
    }

    /**
     * out from room if out signal found.
     * 
     * @private
     * @returns {void}
     */
    _removeFormRommOnSignal = (oldProps) => {
        const {
            _participant,
            _messages
        } = this.props
        const {
            _messages: oldMessages
        } = oldProps || {}

        if(oldMessages !== _messages){
            const id = _participant?.id
            const isOutSignal = _messages.some(m => m.message === CHAT_CODE.EVERYONE_OUT_FROM_ROOM && m.id !== id )
            if(isOutSignal){
                this.props.dispatch(maybeRedirectToWelcomePage())
            }
        }
    }

    /**
     * update rest roles
     * 
     * @private
     * @returns {void}
     */
    _updateRestUserRoles = (oldProps) => {
        const {
            _participants,
            _messages
        } = this.props
        const {
            _participants: oldParticipants
        } = oldProps || {}
        const {
            CHANGE_SHADE_CUBE_ROLE_MORDERATOR,
            CHANGE_SHADE_CUBE_ROLE_NONE,
            PATTERN_SHADE_CUBE_ROLE
        } = CHAT_CODE
        const messages = _messages.filter( m => m.message.startsWith(PATTERN_SHADE_CUBE_ROLE))
        .sort((a, b) => b.timestamp - a.timestamp);
        _participants.forEach(p => {
            if(!p.local){
                const oldRole = (oldParticipants || []).find( oldP => oldP?.id === p?.id)?.shadeCubeRole
                const filtredMessages = messages.filter(m => m.message.includes(p.id))
                const msg = filtredMessages[0]?.message
                if(msg){
                    const morderatorStr = `${CHANGE_SHADE_CUBE_ROLE_MORDERATOR}--${p.id}`
                    const noneStr = `${CHANGE_SHADE_CUBE_ROLE_NONE}--${p.id}`
                    if(msg === morderatorStr && (!oldRole || oldRole !== PARTICIPANT_ROLE.MODERATOR)){
                        this.props.dispatch(participantUpdated({
                            id: p.id,
                            shadeCubeRole: PARTICIPANT_ROLE.MODERATOR
                        }))
                    }else if(msg === noneStr && (!oldRole || oldRole !== PARTICIPANT_ROLE.NONE)){
                        this.props.dispatch(participantUpdated({
                            id: p.id,
                            shadeCubeRole: PARTICIPANT_ROLE.NONE
                        }))
                    }
                }
            }
        })
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            VIDEO_QUALITY_LABEL_DISABLED,

            // XXX The character casing of the name filmStripOnly utilized by
            // interfaceConfig is obsolete but legacy support is required.
            filmStripOnly: filmstripOnly
        } = interfaceConfig;
        const hideVideoQualityLabel
            = filmstripOnly
                || VIDEO_QUALITY_LABEL_DISABLED
                || this.props._iAmRecorder;

        return (
            <div
                className = { this.props._layoutClassName }
                id = 'videoconference_page'
                onMouseMove = { this._onShowToolbar }>
                <Notice />
                <Subject />
                <div id = 'videospace'>
                    <LargeVideo />
                    { hideVideoQualityLabel
                        || <Labels /> }
                    <Filmstrip filmstripOnly = { filmstripOnly } />
                </div>

                { filmstripOnly || <Toolbox /> }
                { filmstripOnly || <Chat /> }

                { this.renderNotificationsContainer() }

                <CalleeInfoContainer />
            </div>
        );
    }

    /**
     * Updates the Redux state when full screen mode has been enabled or
     * disabled.
     *
     * @private
     * @returns {void}
     */
    _onFullScreenChange() {
        this.props.dispatch(fullScreenChanged(APP.UI.isFullScreen()));
    }

    /**
     * Displays the toolbar.
     *
     * @private
     * @returns {void}
     */
    _onShowToolbar() {
        this.props.dispatch(showToolbox());
    }

    /**
     * Until we don't rewrite UI using react components
     * we use UI.start from old app. Also method translates
     * component right after it has been mounted.
     *
     * @inheritdoc
     */
    _start() {
        APP.UI.start();

        APP.UI.registerListeners();
        APP.UI.bindEvents();

        FULL_SCREEN_EVENTS.forEach(name =>
            document.addEventListener(name, this._onFullScreenChange));

        const { dispatch, t } = this.props;

        dispatch(connect());

        maybeShowSuboptimalExperienceNotification(dispatch, t);

        interfaceConfig.filmStripOnly
            && dispatch(setToolboxAlwaysVisible(true));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Conference} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const currentLayout = getCurrentLayout(state);

    return {
        ...abstractMapStateToProps(state),
        _iAmRecorder: state['features/base/config'].iAmRecorder,
        _layoutClassName: LAYOUT_CLASSNAMES[currentLayout],
        _auth: state['features/shade-cube-auth'],
        _shadeCubeRoom: state['features/shade-cube-room'],
        _participants: getParticipants(state),
        _participant: getLocalParticipant(state),
        _messages: state['features/chat'].messages,
    };
}

export default reactReduxConnect(_mapStateToProps)(translate(Conference));
