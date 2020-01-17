export interface PlayerEnteredLobby {
    id: number;
    name: string;
}

export interface PlayerChangedReady {
    id: number;
    newStatus: boolean;
}

export interface PlayerLeftLobby {
    id: number;
}
