/* eslint-disable @typescript-eslint/no-unused-vars */
import locationHumanMarker from "../assets/icons/locationHumanMarker.png";
import locationTargetMarker from "../assets/icons/locationTargetMarker.png";
import locationShopMarker from "../assets/icons/locationShopMarker.png";
import shopIconMarker from "../assets/icons/shopIconMarker.png";

import L from "leaflet";

export const icons = {
    locationHumanMarker: new L.Icon({
        iconUrl: locationHumanMarker,
        iconSize: [50, 50],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),

    locationTargetMarker: new L.Icon({
        iconUrl: locationTargetMarker,
        iconSize: [40, 40],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),

    shopIconMarker: new L.Icon({
        iconUrl: shopIconMarker,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),

    locationShopMarker : new L.Icon({
        iconUrl: locationShopMarker,
        iconSize: [50, 50],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),
};
