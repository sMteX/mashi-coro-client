import { ValidateFailReason } from '~/utils/enums';

export interface PlayerEnteredLobby {
    id: number;
    name: string;
}

// naming is hard - PlayerEnterEDLobby is for OTHER players, broadcast that someone actually managed to enter - will always be successful
// PlayerEnterLobby - is for that given player, it's the type of the response of trying to enter - that may or may not be successful
export interface PlayerEnterLobby {
    success: boolean;
}
export interface PlayerEnterLobbySuccess extends PlayerEnterLobby{
    id: number;
    name: string;
}
export interface PlayerEnterLobbyFail extends PlayerEnterLobby{
    reason: ValidateFailReason;
}

export interface PlayerChangedReady {
    id: number;
    newStatus: boolean;
}

export interface PlayerLeftLobby {
    id: number;
}
