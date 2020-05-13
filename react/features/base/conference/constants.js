/**
 * The command type for updating a participant's avatar ID.
 *
 * @type {string}
 */
export const AVATAR_ID_COMMAND = 'avatar-id';

/**
 * The command type for updating a participant's avatar URL.
 *
 * @type {string}
 */
export const AVATAR_URL_COMMAND = 'avatar-url';

/**
 * The command type for updating a participant's e-mail address.
 *
 * @type {string}
 */
export const EMAIL_COMMAND = 'email';

/**
 * The name of the {@code JitsiConference} property which identifies the URL of
 * the conference represented by the {@code JitsiConference} instance.
 *
 * TODO It was introduced in a moment of desperation. Jitsi Meet SDK for Android
 * and iOS needs to deliver events from the JavaScript side where they originate
 * to the Java and Objective-C sides, respectively, where they are to be
 * handled. The URL of the {@code JitsiConference} was chosen as the identifier
 * because the Java and Objective-C sides join by URL through their respective
 * loadURL methods. But features/base/connection's {@code locationURL} is not
 * guaranteed at the time of this writing to match the {@code JitsiConference}
 * instance when the events are to be fired. Patching {@code JitsiConference}
 * from the outside is not cool but it should suffice for now.
 */
export const JITSI_CONFERENCE_URL_KEY = Symbol('url');

/**
 * The supported remote video resolutions. The values are currently based on
 * available simulcast layers.
 *
 * @type {object}
 */
export const VIDEO_QUALITY_LEVELS = {
    HIGH: 1080,
    STANDARD: 360,
    LOW: 180
};

/**
 * Chat codes using for internal signals to trigger custom events.
 *
 * @type {object}
 */
const PATTERN_START = 'code__code:';
const PATTERN_SCREEN_SHARE = `${PATTERN_START}screenshare:`;
const PATTERN_AUDIO = `${PATTERN_START}audio:`;
const PATTERN_SHADE_CUBE_ROLE = `${PATTERN_START}role:`;
const PATTERN_ROOM = `${PATTERN_START}room:`;

export const CHAT_CODE = {
    PATTERN_START,
    PATTERN_SCREEN_SHARE,
    ENABLE_SCREEN_SHARE: `${PATTERN_SCREEN_SHARE}enable`,
    DISABLE_SCREEN_SHARE: `${PATTERN_SCREEN_SHARE}disable`,

    PATTERN_AUDIO,
    UNMUTE_PARTICIPENT: `${PATTERN_AUDIO}unmute_participent`,
    UNMUTE_ALL_PARTICIPENTS_EXCEPT: `${PATTERN_AUDIO}unmute_all_participents_expect`,
    UNMUTE_ALL_PARTICIPENTS: `${PATTERN_AUDIO}unmute_all_participents`,
    MUTE_PARTICIPENT: `${PATTERN_AUDIO}mute_participent`,
    MUTE_ALL_PARTICIPENTS_EXCEPT: `${PATTERN_AUDIO}mute_all_participents_expect`,
    MUTE_ALL_PARTICIPENTS: `${PATTERN_AUDIO}mute_all_participents`,
    
    PATTERN_SHADE_CUBE_ROLE,
    CHANGE_SHADE_CUBE_ROLE_NONE: `${PATTERN_SHADE_CUBE_ROLE}none`,
    CHANGE_SHADE_CUBE_ROLE_MORDERATOR: `${PATTERN_SHADE_CUBE_ROLE}morderator`,

    EVERYONE_OUT_FROM_ROOM: `${PATTERN_ROOM}out_everyone`
};

export const shadeCubeApis = {
    PROFILE_API: 'https://engine.shadecubecommunicator.com/accounts/profile',
    CONFERENCE_API: 'https://engine.shadecubecommunicator.com/external/video_conference',
}