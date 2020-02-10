export enum CardSymbol {
    Wheat, // Psenicne pole, Jablonovy sad
    Box, // Pekarna, Samoobsluha
    Pig, // Statek
    Coffee, // Kavarna, Restaurace
    Cog, // Les, Dul
    Tower, // Stadion, Televizni studio, Kancelarska budova
    Factory, // Mlekarna, Tovarna na nabytek
    Boat, // Rybarsky clun, Rybarska lod..
    Mall, // Obchodni dum
    Suitcase, // Zalozna, Stavebni firma...
    Other // just in case?
}
export enum CardColor {
    Green,
    Blue,
    Red,
    Purple,
    Dominant
}
export enum CardName {
    WheatField,
    Farm,
    Bakery,
    CoffeeShop,
    Shop,
    Forest,
    Stadium,
    TelevisionStudio,
    OfficeBuilding,
    DairyShop,
    FurnitureFactory,
    Mine,
    ApplePark,
    Restaurant,
    Mall,

    Station,
    ShoppingCenter,
    AmusementPark,
    Transmitter
}

export enum CardLocation {
    Player,
    OtherPlayer,
    Table
}

export interface Card {
    cardName: CardName;
    name: string;
    triggerNumbers: number[];
    symbol: CardSymbol;
    color: CardColor;
    cost: number;
    description: string;
    bought: boolean;
}
