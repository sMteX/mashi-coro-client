export interface PlayerEnteredLobby {
    id: string;
    name: string;
}

export interface PlayerChangedReady {
    id: string;
    newStatus: boolean;
}

export interface PlayerLeftLobby {
    id: string;
}
