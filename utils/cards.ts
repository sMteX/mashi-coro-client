export enum CardSymbol {
    Wheat, // Psenicne pole, Jablonovy sad
    Toast, // Pekarna, Samoobsluha
    Pig, // Statek
    Coffee, // Kavarna, Restaurace
    Cog, // Les, Dul
    Tower, // Stadion, Televizni studio, Kancelarska budova
    Factory, // Mlekarna, Tovarna na nabytek
    Other // Obchodni dum...
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

export interface Card {
    cardName: CardName;
    name: string;
    triggerNumbers: number[];
    symbol: CardSymbol;
    cost: number;
    description: string;
    canBeTriggeredByOthers: boolean;
    canBeTriggeredBySelf: boolean;
    bought?: boolean;
}